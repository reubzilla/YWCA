const VOLUNTEER_ASSIGNMENT_HEADERS_ = Object.freeze([
  'Session ID',
  'Member ID',
  'Student Email',
  'Activity',
  'Location',
  'Departure Time',
  'Assignment Status',
  'Notes'
]);

/**
 * Returns only the signed-in member's volunteer assignments.
 *
 * @return {Object}
 */
function getMyVolunteerAssignments() {
  const member = requireVolunteerScheduleViewer_();
  const sheetData = getVolunteerAssignmentSheet_();
  const memberId = String(
    member['Member ID'] || ''
  ).trim();
  const email = normalizeVolunteerEmail_(member.Email);
  const sessionsById = getVisitorSessionsById_();
  const todayDateValue = getTodayDateValue_();
  const assignments = sheetData.values
    .slice(1)
    .filter(row => {
      const object = rowToObject_(sheetData.headers, row);

      return memberMatches_(object, memberId, email);
    })
    .map(row => mapPersonalVolunteerAssignment_(
      rowToObject_(sheetData.headers, row),
      sessionsById
    ))
    .sort((a, b) =>
      compareVolunteerAssignments_(
        a,
        b,
        todayDateValue
      )
    );

  return {
    assignments: assignments,
    todayDateValue: todayDateValue
  };
}


/**
 * Returns limited member and assignment data for managers.
 *
 * Private availability reasons, attendance details, and member
 * emails are deliberately excluded from the response.
 *
 * @return {Object}
 */
function getVisitorScheduleManagementData() {
  requireVolunteerManagerAccess_();

  const sheetData = getVolunteerAssignmentSheet_();
  const sessionRows = getSheetObjects_(CONFIG.SHEETS.SESSIONS);
  const memberRows = getSheetObjects_(CONFIG.SHEETS.MEMBERS);
  const availabilityRows = getSheetObjects_(
    CONFIG.SHEETS.AVAILABILITY
  );
  const attendanceRows = getSheetObjects_(
    CONFIG.SHEETS.ATTENDANCE
  );
  const todayDateValue = getTodayDateValue_();
  const sessionsById = Object.fromEntries(
    sessionRows.map(row => [
      String(row['Session ID'] || '').trim(),
      row
    ])
  );
  const upcomingSessions = sessionRows
    .filter(row => isVisitorSessionAssignable_(row))
    .map(row => mapSessionForClient_(
      row,
      getTimeZone_()
    ))
    .sort((a, b) =>
      a.dateValue.localeCompare(b.dateValue) ||
      a.startTime.localeCompare(b.startTime) ||
      a.sessionId.localeCompare(b.sessionId)
    );
  const eligibleMembers = memberRows
    .filter(isEligibleVolunteerMember_)
    .map(member => mapEligibleVolunteerMember_(
      member,
      availabilityRows,
      upcomingSessions
    ))
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'ja') ||
      a.memberId.localeCompare(b.memberId)
    );
  const assignments = sheetData.values
    .slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => mapManagedVolunteerAssignment_(
      rowToObject_(sheetData.headers, row),
      sessionsById,
      memberRows,
      availabilityRows,
      attendanceRows,
      todayDateValue
    ))
    .sort((a, b) =>
      compareVolunteerAssignments_(
        a,
        b,
        todayDateValue
      )
    );

  return {
    sessions: upcomingSessions,
    members: eligibleMembers,
    assignments: assignments,
    assignmentStatuses: getVolunteerAssignmentStatuses_(),
    todayDateValue: todayDateValue
  };
}


/**
 * Creates assignments for one or more active eligible members.
 *
 * @param {Object} submission
 * @return {Object}
 */
function createVolunteerAssignments(submission) {
  const manager = requireVolunteerManagerAccess_();
  const validation = validateVolunteerAssignmentSubmission_(
    submission,
    true
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getVolunteerRequestResult_(
      manager,
      'create',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getVolunteerAssignmentSheet_();
    const context = getValidatedVolunteerContext_(
      validation.value.sessionId,
      validation.value.memberIds
    );

    if (!context.success) {
      return context;
    }

    const departureValidation =
      validateVolunteerDepartureForSession_(
        validation.value.departureTime,
        context.session
      );

    if (!departureValidation.success) {
      return departureValidation;
    }

    const duplicateMembers = context.members.filter(member =>
      findVolunteerAssignmentRows_(
        validation.value.sessionId,
        String(member['Member ID'] || '').trim(),
        normalizeVolunteerEmail_(member.Email),
        sheetData.values,
        sheetData.headers
      ).length > 0
    );

    if (duplicateMembers.length > 0) {
      return {
        success: false,
        errorCode: 'duplicateAssignment',
        memberNames: duplicateMembers.map(member =>
          String(member.Name || '')
        )
      };
    }

    const availability = getVolunteerAvailabilityNotices_(
      validation.value.sessionId,
      context.members
    );

    if (
      availability.unavailable.length > 0 &&
      submission.allowUnavailable !== true
    ) {
      return {
        success: false,
        errorCode: 'unavailableMembers',
        requiresConfirmation: true,
        memberNames: availability.unavailable
      };
    }

    const rows = context.members.map(member => {
      const rowObject = buildVolunteerAssignmentRow_(
        validation.value.sessionId,
        member,
        validation.value
      );

      return sheetData.headers.map(header =>
        Object.prototype.hasOwnProperty.call(
          rowObject,
          header
        )
          ? rowObject[header]
          : ''
      );
    });

    sheetData.sheet
      .getRange(
        sheetData.sheet.getLastRow() + 1,
        1,
        rows.length,
        sheetData.headers.length
      )
      .setValues(rows);
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'created',
      count: rows.length,
      notices: availability
    };

    cacheVolunteerRequestResult_(
      manager,
      'create',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Updates one assignment identified by its original composite key.
 *
 * @param {Object} submission
 * @return {Object}
 */
function updateVolunteerAssignment(submission) {
  const manager = requireVolunteerManagerAccess_();
  const validation = validateVolunteerAssignmentSubmission_(
    submission,
    false
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getVolunteerRequestResult_(
      manager,
      'update',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getVolunteerAssignmentSheet_();
    const memberRows = getSheetObjects_(CONFIG.SHEETS.MEMBERS);
    const originalMember = findVolunteerMemberById_(
      validation.value.originalMemberId,
      memberRows
    );
    const matches = findVolunteerAssignmentRows_(
      validation.value.originalSessionId,
      validation.value.originalMemberId,
      originalMember
        ? normalizeVolunteerEmail_(originalMember.Email)
        : '',
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return volunteerManagementFailure_('assignmentNotFound');
    }

    if (matches.length > 1) {
      return volunteerManagementFailure_(
        'duplicateExistingAssignment'
      );
    }

    const context = getValidatedVolunteerContext_(
      validation.value.sessionId,
      validation.value.memberIds
    );

    if (!context.success) {
      return context;
    }

    const departureValidation =
      validateVolunteerDepartureForSession_(
        validation.value.departureTime,
        context.session
      );

    if (!departureValidation.success) {
      return departureValidation;
    }

    const targetMember = context.members[0];
    const targetChanged =
      validation.value.sessionId !==
        validation.value.originalSessionId ||
      String(targetMember['Member ID'] || '').trim() !==
        validation.value.originalMemberId;

    if (
      targetChanged &&
      findVolunteerAssignmentRows_(
        validation.value.sessionId,
        String(targetMember['Member ID'] || '').trim(),
        normalizeVolunteerEmail_(targetMember.Email),
        sheetData.values,
        sheetData.headers
      ).length > 0
    ) {
      return volunteerManagementFailure_('duplicateAssignment');
    }

    const availability = getVolunteerAvailabilityNotices_(
      validation.value.sessionId,
      [targetMember]
    );

    if (
      availability.unavailable.length > 0 &&
      submission.allowUnavailable !== true
    ) {
      return {
        success: false,
        errorCode: 'unavailableMembers',
        requiresConfirmation: true,
        memberNames: availability.unavailable
      };
    }

    const match = matches[0];
    const rowObject = buildVolunteerAssignmentRow_(
      validation.value.sessionId,
      targetMember,
      validation.value
    );
    const newRow = sheetData.headers.map(
      (header, index) =>
        Object.prototype.hasOwnProperty.call(
          rowObject,
          header
        )
          ? rowObject[header]
          : sheetData.values[match.rowIndex][index]
    );

    sheetData.sheet
      .getRange(
        match.rowIndex + 1,
        1,
        1,
        newRow.length
      )
      .setValues([newRow]);
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'updated',
      count: 1,
      notices: availability
    };

    cacheVolunteerRequestResult_(
      manager,
      'update',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Marks an assignment Cancelled while preserving its row.
 *
 * @param {Object} submission
 * @return {Object}
 */
function cancelVolunteerAssignment(submission) {
  const manager = requireVolunteerManagerAccess_();
  const validation = validateVolunteerActionSubmission_(submission);

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getVolunteerRequestResult_(
      manager,
      'cancel',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getVolunteerAssignmentSheet_();
    const member = findVolunteerMemberById_(
      validation.value.memberId,
      getSheetObjects_(CONFIG.SHEETS.MEMBERS)
    );
    const matches = findVolunteerAssignmentRows_(
      validation.value.sessionId,
      validation.value.memberId,
      member ? normalizeVolunteerEmail_(member.Email) : '',
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return volunteerManagementFailure_('assignmentNotFound');
    }

    if (matches.length > 1) {
      return volunteerManagementFailure_(
        'duplicateExistingAssignment'
      );
    }

    const statusIndex = sheetData.headers.indexOf(
      'Assignment Status'
    );
    const match = matches[0];

    sheetData.sheet
      .getRange(
        match.rowIndex + 1,
        statusIndex + 1
      )
      .setValue(CONFIG.ASSIGNMENT_STATUSES.CANCELLED);
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'cancelled'
    };

    cacheVolunteerRequestResult_(
      manager,
      'cancel',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Permanently deletes only a safe future assignment.
 *
 * Attendance rows are read for integrity checks and never changed.
 *
 * @param {Object} submission
 * @return {Object}
 */
function deleteVolunteerAssignment(submission) {
  const manager = requireVolunteerManagerAccess_();
  const validation = validateVolunteerActionSubmission_(submission);

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getVolunteerRequestResult_(
      manager,
      'delete',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getVolunteerAssignmentSheet_();
    const member = findVolunteerMemberById_(
      validation.value.memberId,
      getSheetObjects_(CONFIG.SHEETS.MEMBERS)
    );
    const memberEmail = member
      ? normalizeVolunteerEmail_(member.Email)
      : '';
    const matches = findVolunteerAssignmentRows_(
      validation.value.sessionId,
      validation.value.memberId,
      memberEmail,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return volunteerManagementFailure_('assignmentNotFound');
    }

    if (matches.length > 1) {
      return volunteerManagementFailure_(
        'duplicateExistingAssignment'
      );
    }

    const session = getSheetObjects_(
      CONFIG.SHEETS.SESSIONS
    ).find(row =>
      String(row['Session ID'] || '').trim() ===
        validation.value.sessionId
    );

    if (!session) {
      return volunteerDeleteBlocked_('sessionMissing');
    }

    if (
      classifySessionDate_(session.Date) !==
        SESSION_DATE_CLASSIFICATIONS_.UPCOMING
    ) {
      return volunteerDeleteBlocked_('historicalAssignment');
    }

    const hasAttendance = getSheetObjects_(
      CONFIG.SHEETS.ATTENDANCE
    ).some(row =>
      String(row['Session ID'] || '').trim() ===
        validation.value.sessionId &&
      volunteerMemberMatches_(
        row,
        validation.value.memberId,
        memberEmail
      )
    );

    if (hasAttendance) {
      return volunteerDeleteBlocked_('attendanceLinked');
    }

    sheetData.sheet.deleteRow(matches[0].rowIndex + 1);
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'deleted'
    };

    cacheVolunteerRequestResult_(
      manager,
      'delete',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


function requireVolunteerScheduleViewer_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canViewOwnSchedule) {
    throw new Error(
      'You do not have permission to view volunteer assignments.'
    );
  }

  return member;
}


function requireVolunteerManagerAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canManageVolunteers) {
    throw new Error(
      'You do not have permission to manage visitor schedules.'
    );
  }

  return member;
}


function validateVolunteerAssignmentSubmission_(
  submission,
  creating
) {
  if (!submission || typeof submission !== 'object') {
    return volunteerManagementFailure_('invalidSubmission');
  }

  const sessionId = String(
    submission.sessionId || ''
  ).trim();
  const originalSessionId = String(
    submission.originalSessionId || ''
  ).trim();
  const originalMemberId = String(
    submission.originalMemberId || ''
  ).trim();
  const rawMemberIds = creating
    ? submission.memberIds
    : [submission.memberId];
  const memberIds = Array.isArray(rawMemberIds)
    ? [...new Set(rawMemberIds.map(value =>
        String(value || '').trim()
      ).filter(Boolean))]
    : [];
  const activity = String(submission.activity || '').trim();
  const location = String(submission.location || '').trim();
  const departureTime = String(
    submission.departureTime || ''
  ).trim();
  const assignmentStatus = String(
    submission.assignmentStatus || ''
  ).trim();
  const notes = String(submission.notes || '');
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!creating && (!originalSessionId || !originalMemberId)) {
    return volunteerManagementFailure_('originalKeyRequired');
  }

  if (!sessionId) {
    return volunteerManagementFailure_('sessionRequired');
  }

  if (memberIds.length === 0) {
    return volunteerManagementFailure_('memberRequired');
  }

  if (!creating && memberIds.length !== 1) {
    return volunteerManagementFailure_('memberRequired');
  }

  if (
    departureTime &&
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(departureTime)
  ) {
    return volunteerManagementFailure_('departureTimeInvalid');
  }

  if (!getVolunteerAssignmentStatuses_().includes(
    assignmentStatus
  )) {
    return volunteerManagementFailure_('statusInvalid');
  }

  if (!isValidVolunteerRequestId_(requestId)) {
    return volunteerManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      originalSessionId: originalSessionId,
      originalMemberId: originalMemberId,
      sessionId: sessionId,
      memberIds: memberIds,
      activity: activity,
      location: location,
      departureTime: departureTime,
      assignmentStatus: assignmentStatus,
      notes: notes,
      requestId: requestId
    }
  };
}


function validateVolunteerActionSubmission_(submission) {
  if (!submission || typeof submission !== 'object') {
    return volunteerManagementFailure_('invalidSubmission');
  }

  const sessionId = String(
    submission.sessionId || ''
  ).trim();
  const memberId = String(
    submission.memberId || ''
  ).trim();
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!sessionId) {
    return volunteerManagementFailure_('sessionRequired');
  }

  if (!memberId) {
    return volunteerManagementFailure_('memberRequired');
  }

  if (!isValidVolunteerRequestId_(requestId)) {
    return volunteerManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      sessionId: sessionId,
      memberId: memberId,
      requestId: requestId
    }
  };
}


function getValidatedVolunteerContext_(sessionId, memberIds) {
  const sessionMatches = getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  ).filter(row =>
    String(row['Session ID'] || '').trim() === sessionId
  );

  if (sessionMatches.length === 0) {
    return volunteerManagementFailure_('sessionNotFound');
  }

  if (sessionMatches.length > 1) {
    return volunteerManagementFailure_('duplicateSessionId');
  }

  const session = sessionMatches[0];

  if (!isVisitorSessionAssignable_(session)) {
    return volunteerManagementFailure_('sessionNotActive');
  }

  const memberRows = getSheetObjects_(CONFIG.SHEETS.MEMBERS);
  const members = [];

  for (const memberId of memberIds) {
    const matches = memberRows.filter(row =>
      String(row['Member ID'] || '').trim() === memberId
    );

    if (matches.length === 0) {
      return volunteerManagementFailure_('memberNotFound');
    }

    if (matches.length > 1) {
      return volunteerManagementFailure_('duplicateMemberId');
    }

    if (!isEligibleVolunteerMember_(matches[0])) {
      return volunteerManagementFailure_('memberNotEligible');
    }

    members.push(matches[0]);
  }

  return {
    success: true,
    session: session,
    members: members
  };
}


function isVisitorSessionAssignable_(session) {
  const dateClassification = classifySessionDate_(session.Date);
  const sessionType = String(
    session['Session Type'] || ''
  ).trim();

  return Boolean(
    (
      dateClassification === SESSION_DATE_CLASSIFICATIONS_.TODAY ||
      dateClassification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING
    ) &&
    isTrue_(session.Active) &&
    sessionType !== CONFIG.SESSION_TYPES.CANCELLED
  );
}


function isEligibleVolunteerMember_(member) {
  const role = String(member.Role || '').trim();

  return Boolean(
    isTrue_(member.Active) &&
    (
      role === CONFIG.ROLES.STUDENT ||
      role === CONFIG.ROLES.CLUB_LEADER
    )
  );
}


function validateVolunteerDepartureForSession_(
  departureTime,
  session
) {
  if (!departureTime) {
    return { success: true };
  }

  const endTime = formatTime_(
    session['End Time'],
    getTimeZone_()
  );

  if (
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(endTime) &&
    departureTime > endTime
  ) {
    return volunteerManagementFailure_('departureAfterEnd');
  }

  return { success: true };
}


function getVolunteerAvailabilityNotices_(sessionId, members) {
  const rows = getSheetObjects_(CONFIG.SHEETS.AVAILABILITY);
  const notices = {
    unavailable: [],
    unsure: [],
    noResponse: []
  };

  members.forEach(member => {
    const response = findVolunteerAvailabilityResponse_(
      sessionId,
      member,
      rows
    );
    const name = String(member.Name || '');

    if (response === CONFIG.AVAILABILITY.UNAVAILABLE) {
      notices.unavailable.push(name);
    } else if (response === CONFIG.AVAILABILITY.UNSURE) {
      notices.unsure.push(name);
    } else if (!response) {
      notices.noResponse.push(name);
    }
  });

  return notices;
}


function findVolunteerAvailabilityResponse_(
  sessionId,
  member,
  availabilityRows
) {
  const memberId = String(
    member['Member ID'] || ''
  ).trim();
  const email = normalizeVolunteerEmail_(member.Email);
  const row = availabilityRows.find(item =>
    String(item['Session ID'] || '').trim() === sessionId &&
    memberMatches_(item, memberId, email)
  );

  return row ? String(row.Response || '').trim() : '';
}


function getVolunteerAssignmentSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(
    CONFIG.SHEETS.VOLUNTEERS
  );

  if (!sheet) {
    throw new Error(
      'The Volunteer Assignments sheet could not be found.'
    );
  }

  const values = sheet.getDataRange().getValues();

  if (values.length === 0) {
    throw new Error(
      'The Volunteer Assignments sheet does not have a header row.'
    );
  }

  const headers = values[0].map(header =>
    String(header).trim()
  );
  const missingHeaders = VOLUNTEER_ASSIGNMENT_HEADERS_
    .filter(header => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(
      'The Volunteer Assignments sheet is missing required columns.'
    );
  }

  return {
    sheet: sheet,
    headers: headers,
    values: values
  };
}


function getVisitorSessionsById_() {
  return Object.fromEntries(
    getSheetObjects_(CONFIG.SHEETS.SESSIONS).map(row => [
      String(row['Session ID'] || '').trim(),
      row
    ])
  );
}


function mapPersonalVolunteerAssignment_(row, sessionsById) {
  const sessionId = String(row['Session ID'] || '').trim();
  const session = sessionsById[sessionId];

  return {
    sessionId: sessionId,
    dateValue: session
      ? formatDateOnly_(session.Date, getTimeZone_())
      : '',
    dateClassification: session
      ? classifySessionDate_(session.Date)
      : '',
    sessionTitle: session ? String(session.Title || '') : '',
    activity: String(row.Activity || ''),
    location: String(row.Location || ''),
    departureTime: formatTime_(
      row['Departure Time'],
      getTimeZone_()
    ),
    assignmentStatus: String(
      row['Assignment Status'] || ''
    ).trim(),
    notes: String(row.Notes || '')
  };
}


function mapEligibleVolunteerMember_(
  member,
  availabilityRows,
  sessions
) {
  const availability = {};

  sessions.forEach(session => {
    availability[session.sessionId] =
      findVolunteerAvailabilityResponse_(
        session.sessionId,
        member,
        availabilityRows
      );
  });

  return {
    memberId: String(member['Member ID'] || '').trim(),
    name: String(member.Name || ''),
    grade: String(member.Grade || ''),
    role: String(member.Role || '').trim(),
    availability: availability
  };
}


function mapManagedVolunteerAssignment_(
  row,
  sessionsById,
  memberRows,
  availabilityRows,
  attendanceRows,
  todayDateValue
) {
  const sessionId = String(row['Session ID'] || '').trim();
  const session = sessionsById[sessionId];
  const member = findVolunteerMemberForRow_(row, memberRows);
  const storedMemberId = String(
    row['Member ID'] || ''
  ).trim();
  const memberId = member
    ? String(member['Member ID'] || '').trim()
    : storedMemberId;
  const memberEmail = member
    ? normalizeVolunteerEmail_(member.Email)
    : normalizeVolunteerEmail_(row['Student Email']);
  const dateValue = session
    ? formatDateOnly_(session.Date, getTimeZone_())
    : '';
  const hasAttendance = attendanceRows.some(item =>
    String(item['Session ID'] || '').trim() === sessionId &&
    volunteerMemberMatches_(item, memberId, memberEmail)
  );
  const availability = member
    ? findVolunteerAvailabilityResponse_(
        sessionId,
        member,
        availabilityRows
      )
    : '';

  return {
    sessionId: sessionId,
    dateValue: dateValue,
    sessionTitle: session ? String(session.Title || '') : '',
    sessionStartTime: session
      ? formatTime_(session['Start Time'], getTimeZone_())
      : '',
    sessionEndTime: session
      ? formatTime_(session['End Time'], getTimeZone_())
      : '',
    memberId: memberId,
    memberName: member ? String(member.Name || '') : '',
    memberGrade: member ? String(member.Grade || '') : '',
    memberRole: member
      ? String(member.Role || '').trim()
      : '',
    availability: availability,
    activity: String(row.Activity || ''),
    location: String(row.Location || ''),
    departureTime: formatTime_(
      row['Departure Time'],
      getTimeZone_()
    ),
    assignmentStatus: String(
      row['Assignment Status'] || ''
    ).trim(),
    notes: String(row.Notes || ''),
    canEdit: Boolean(
      session &&
      isVisitorSessionAssignable_(session) &&
      member &&
      isEligibleVolunteerMember_(member)
    ),
    canDelete: Boolean(
      classifySessionDate_(dateValue, todayDateValue) ===
        SESSION_DATE_CLASSIFICATIONS_.UPCOMING &&
      !hasAttendance
    ),
    hasAttendance: hasAttendance
  };
}


function findVolunteerMemberForRow_(row, memberRows) {
  const memberId = String(row['Member ID'] || '').trim();

  if (memberId) {
    return memberRows.find(member =>
      String(member['Member ID'] || '').trim() === memberId
    ) || null;
  }

  const email = normalizeVolunteerEmail_(
    row['Student Email']
  );

  return memberRows.find(member =>
    normalizeVolunteerEmail_(member.Email) === email
  ) || null;
}


function findVolunteerMemberById_(memberId, memberRows) {
  return memberRows.find(member =>
    String(member['Member ID'] || '').trim() === memberId
  ) || null;
}


function findVolunteerAssignmentRows_(
  sessionId,
  memberId,
  email,
  values,
  headers
) {
  const sessionIndex = headers.indexOf('Session ID');
  const memberIndex = headers.indexOf('Member ID');
  const emailIndex = headers.indexOf('Student Email');
  const matches = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];

    if (
      String(row[sessionIndex] || '').trim() !== sessionId
    ) {
      continue;
    }

    const rowMemberId = String(row[memberIndex] || '').trim();
    const rowEmail = normalizeVolunteerEmail_(row[emailIndex]);

    if (
      (memberId && rowMemberId === memberId) ||
      (!rowMemberId && email && rowEmail === email)
    ) {
      matches.push({ rowIndex: rowIndex });
    }
  }

  return matches;
}


function volunteerMemberMatches_(row, memberId, email) {
  const rowMemberId = String(
    row['Member ID'] || ''
  ).trim();
  const rowEmail = normalizeVolunteerEmail_(
    row['Student Email'] || row.Email
  );

  return Boolean(
    (memberId && rowMemberId === memberId) ||
    (!rowMemberId && email && rowEmail === email)
  );
}


function buildVolunteerAssignmentRow_(sessionId, member, value) {
  return {
    'Session ID': sessionId,
    'Member ID': String(member['Member ID'] || '').trim(),
    'Student Email': normalizeVolunteerEmail_(member.Email),
    'Activity': value.activity,
    'Location': value.location,
    'Departure Time': value.departureTime,
    'Assignment Status': value.assignmentStatus,
    'Notes': value.notes
  };
}


function compareVolunteerAssignments_(a, b, todayDateValue) {
  const aClassification = classifySessionDate_(
    a.dateValue,
    todayDateValue
  );
  const bClassification = classifySessionDate_(
    b.dateValue,
    todayDateValue
  );
  const aUpcoming =
    aClassification === SESSION_DATE_CLASSIFICATIONS_.TODAY ||
    aClassification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING;
  const bUpcoming =
    bClassification === SESSION_DATE_CLASSIFICATIONS_.TODAY ||
    bClassification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING;

  if (aUpcoming !== bUpcoming) {
    return aUpcoming ? -1 : 1;
  }

  const dateComparison = aUpcoming
    ? a.dateValue.localeCompare(b.dateValue)
    : b.dateValue.localeCompare(a.dateValue);

  return dateComparison ||
    a.departureTime.localeCompare(b.departureTime) ||
    String(a.memberName || '').localeCompare(
      String(b.memberName || ''),
      'ja'
    );
}


function getVolunteerAssignmentStatuses_() {
  return [
    CONFIG.ASSIGNMENT_STATUSES.ASSIGNED,
    CONFIG.ASSIGNMENT_STATUSES.CONFIRMED,
    CONFIG.ASSIGNMENT_STATUSES.DECLINED,
    CONFIG.ASSIGNMENT_STATUSES.CANCELLED
  ];
}


function normalizeVolunteerEmail_(value) {
  return String(value || '').trim().toLowerCase();
}


function isValidVolunteerRequestId_(requestId) {
  return Boolean(
    requestId &&
    requestId.length <= 100 &&
    /^[A-Za-z0-9_-]+$/.test(requestId)
  );
}


function getVolunteerRequestResult_(
  manager,
  operation,
  requestId
) {
  const cached = CacheService.getScriptCache().get(
    getVolunteerRequestCacheKey_(
      manager,
      operation,
      requestId
    )
  );

  return cached ? JSON.parse(cached) : null;
}


function cacheVolunteerRequestResult_(
  manager,
  operation,
  requestId,
  result
) {
  CacheService.getScriptCache().put(
    getVolunteerRequestCacheKey_(
      manager,
      operation,
      requestId
    ),
    JSON.stringify(result),
    600
  );
}


function getVolunteerRequestCacheKey_(
  manager,
  operation,
  requestId
) {
  return `volunteer-${operation}:${
    normalizeVolunteerEmail_(manager.Email)
  }:${requestId}`;
}


function volunteerDeleteBlocked_(errorCode) {
  return {
    success: false,
    errorCode: errorCode,
    canCancel: true
  };
}


function volunteerManagementFailure_(errorCode) {
  return {
    success: false,
    errorCode: errorCode
  };
}
