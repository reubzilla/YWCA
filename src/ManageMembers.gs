const MEMBER_MANAGEMENT_HEADERS_ = Object.freeze([
  'Member ID',
  'Name',
  'Email',
  'Grade',
  'Role',
  'Active',
  'Join Date',
  'Leave Date'
]);

/**
 * Returns all members for the Teacher management view.
 *
 * @return {Object}
 */
function getMemberManagementData() {
  const teacher = requireMemberTeacherAccess_();
  const sheetData = getMemberManagementSheet_();
  const teacherEmail = normalizeMemberEmail_(teacher.Email);
  const members = sheetData.values
    .slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => mapManagedMemberForClient_(
      rowToObject_(sheetData.headers, row),
      teacherEmail
    ))
    .sort(compareManagedMembers_);

  return {
    members: members,
    roles: getMemberManagementRoles_(),
    todayDateValue: formatDateOnly_(
      new Date(),
      getTimeZone_()
    ),
    grades: [...new Set(
      members
        .map(member => member.grade)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'ja'))
  };
}


/**
 * Creates a member with a server-generated M001-style ID.
 *
 * @param {Object} submission
 * @return {Object}
 */
function createMember(submission) {
  const teacher = requireMemberTeacherAccess_();
  const validation = validateMemberSubmission_(
    submission,
    true
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getMemberRequestResult_(
      teacher,
      'create',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getMemberManagementSheet_();

    if (hasMemberEmail_(
      sheetData.values,
      sheetData.headers,
      validation.value.email,
      ''
    )) {
      return memberManagementFailure_('duplicateEmail');
    }

    const memberId = generateMemberId_(
      sheetData.values,
      sheetData.headers
    );
    const rowObject = buildMemberRowObject_(
      memberId,
      validation.value
    );

    sheetData.sheet.appendRow(
      sheetData.headers.map(header =>
        Object.prototype.hasOwnProperty.call(
          rowObject,
          header
        )
          ? rowObject[header]
          : ''
      )
    );
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'created',
      member: mapManagedMemberForClient_(
        rowObject,
        normalizeMemberEmail_(teacher.Email)
      )
    };

    cacheMemberRequestResult_(
      teacher,
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
 * Updates an existing member without changing the Member ID.
 *
 * @param {Object} submission
 * @return {Object}
 */
function updateMember(submission) {
  const teacher = requireMemberTeacherAccess_();
  const validation = validateMemberSubmission_(
    submission,
    false
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getMemberRequestResult_(
      teacher,
      'update',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getMemberManagementSheet_();
    const matches = findMemberRows_(
      validation.value.memberId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return memberManagementFailure_('memberNotFound');
    }

    if (matches.length > 1) {
      return memberManagementFailure_('duplicateMemberId');
    }

    if (hasMemberEmail_(
      sheetData.values,
      sheetData.headers,
      validation.value.email,
      validation.value.memberId
    )) {
      return memberManagementFailure_('duplicateEmail');
    }

    const match = matches[0];
    const existingRow = rowToObject_(
      sheetData.headers,
      sheetData.values[match.rowIndex]
    );
    const protection = validateMemberAccessChange_(
      teacher,
      existingRow,
      validation.value,
      sheetData.values,
      sheetData.headers,
      submission.selfAccessConfirmation
    );

    if (!protection.success) {
      return protection;
    }

    const rowObject = buildMemberRowObject_(
      validation.value.memberId,
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
      member: mapManagedMemberForClient_(
        rowObject,
        normalizeMemberEmail_(teacher.Email)
      )
    };

    cacheMemberRequestResult_(
      teacher,
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
 * Activates or deactivates one member.
 *
 * Deactivation requires an explicit Leave Date.
 *
 * @param {Object} submission
 * @return {Object}
 */
function setMemberActiveStatus(submission) {
  const teacher = requireMemberTeacherAccess_();
  const validation = validateMemberStatusSubmission_(submission);

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getMemberRequestResult_(
      teacher,
      'status',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getMemberManagementSheet_();
    const matches = findMemberRows_(
      validation.value.memberId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return memberManagementFailure_('memberNotFound');
    }

    if (matches.length > 1) {
      return memberManagementFailure_('duplicateMemberId');
    }

    const match = matches[0];
    const existingRow = rowToObject_(
      sheetData.headers,
      sheetData.values[match.rowIndex]
    );
    const joinDate = parseSheetDate_(
      existingRow['Join Date']
    );

    if (
      !validation.value.active &&
      joinDate &&
      validation.value.leaveDate.getTime() <
        joinDate.getTime()
    ) {
      return memberManagementFailure_('leaveBeforeJoin');
    }

    const proposedValue = {
      email: normalizeMemberEmail_(existingRow.Email),
      role: String(existingRow.Role || '').trim(),
      active: validation.value.active
    };
    const protection = validateMemberAccessChange_(
      teacher,
      existingRow,
      proposedValue,
      sheetData.values,
      sheetData.headers,
      submission.selfAccessConfirmation
    );

    if (!protection.success) {
      return protection;
    }

    const activeIndex = sheetData.headers.indexOf('Active');
    const leaveDateIndex = sheetData.headers.indexOf(
      'Leave Date'
    );
    const newRow = [...sheetData.values[match.rowIndex]];

    newRow[activeIndex] = validation.value.active;
    newRow[leaveDateIndex] = validation.value.active
      ? ''
      : validation.value.leaveDate;

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
      operation: validation.value.active
        ? 'activated'
        : 'deactivated',
      memberId: validation.value.memberId
    };

    cacheMemberRequestResult_(
      teacher,
      'status',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Permanently deletes a member only when no linked rows exist.
 *
 * @param {Object} submission
 * @return {Object}
 */
function deleteMember(submission) {
  const teacher = requireMemberTeacherAccess_();
  const validation = validateMemberDeleteSubmission_(submission);

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getMemberRequestResult_(
      teacher,
      'delete',
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getMemberManagementSheet_();
    const matches = findMemberRows_(
      validation.value.memberId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return memberManagementFailure_('memberNotFound');
    }

    if (matches.length > 1) {
      return memberManagementFailure_('duplicateMemberId');
    }

    const match = matches[0];
    const existingRow = rowToObject_(
      sheetData.headers,
      sheetData.values[match.rowIndex]
    );
    const proposedValue = {
      email: normalizeMemberEmail_(existingRow.Email),
      role: '',
      active: false
    };
    const protection = validateMemberAccessChange_(
      teacher,
      existingRow,
      proposedValue,
      sheetData.values,
      sheetData.headers,
      submission.selfAccessConfirmation
    );

    if (!protection.success) {
      return protection;
    }

    const linkedRecords = getLinkedMemberRecordCounts_(
      existingRow
    );
    const linkedTotal = Object.values(linkedRecords)
      .reduce((total, count) => total + count, 0);

    if (linkedTotal > 0) {
      return {
        success: false,
        errorCode: 'linkedRecords',
        canDeactivate: true,
        linkedRecords: linkedRecords
      };
    }

    sheetData.sheet.deleteRow(match.rowIndex + 1);
    SpreadsheetApp.flush();

    const result = {
      success: true,
      operation: 'deleted',
      memberId: validation.value.memberId
    };

    cacheMemberRequestResult_(
      teacher,
      'delete',
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Requires the signed-in user to be an active Teacher.
 *
 * @return {Object}
 */
function requireMemberTeacherAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canManageMembers) {
    throw new Error(
      'You do not have permission to manage members.'
    );
  }

  return member;
}


function validateMemberSubmission_(submission, creating) {
  if (!submission || typeof submission !== 'object') {
    return memberManagementFailure_('invalidSubmission');
  }

  const memberId = String(
    submission.memberId || ''
  ).trim();
  const name = String(submission.name || '').trim();
  const email = normalizeMemberEmail_(submission.email);
  const grade = String(submission.grade || '').trim();
  const role = String(submission.role || '').trim();
  const joinDateValue = String(
    submission.joinDateValue || ''
  ).trim();
  const leaveDateValue = String(
    submission.leaveDateValue || ''
  ).trim();
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!creating && !memberId) {
    return memberManagementFailure_('memberIdRequired');
  }

  if (!name) {
    return memberManagementFailure_('nameRequired');
  }

  if (!email) {
    return memberManagementFailure_('emailRequired');
  }

  if (!isValidMemberEmail_(email)) {
    return memberManagementFailure_('emailInvalid');
  }

  if (!getMemberManagementRoles_().includes(role)) {
    return memberManagementFailure_('roleInvalid');
  }

  if (typeof submission.active !== 'boolean') {
    return memberManagementFailure_('activeInvalid');
  }

  const joinDate = joinDateValue
    ? parseDateOnlyInput_(joinDateValue)
    : '';
  const leaveDate = leaveDateValue
    ? parseDateOnlyInput_(leaveDateValue)
    : '';

  if (joinDateValue && !joinDate) {
    return memberManagementFailure_('joinDateInvalid');
  }

  if (leaveDateValue && !leaveDate) {
    return memberManagementFailure_('leaveDateInvalid');
  }

  if (
    joinDate &&
    leaveDate &&
    leaveDate.getTime() < joinDate.getTime()
  ) {
    return memberManagementFailure_('leaveBeforeJoin');
  }

  if (
    !submission.active &&
    !leaveDate &&
    submission.allowMissingLeaveDate !== true
  ) {
    return {
      success: false,
      errorCode: 'leaveDateRecommended',
      requiresConfirmation: true
    };
  }

  if (!isValidMemberRequestId_(requestId)) {
    return memberManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      memberId: memberId,
      name: name,
      email: email,
      grade: grade,
      role: role,
      active: submission.active,
      joinDate: joinDate,
      leaveDate: leaveDate,
      requestId: requestId
    }
  };
}


function validateMemberStatusSubmission_(submission) {
  if (!submission || typeof submission !== 'object') {
    return memberManagementFailure_('invalidSubmission');
  }

  const memberId = String(
    submission.memberId || ''
  ).trim();
  const leaveDateValue = String(
    submission.leaveDateValue || ''
  ).trim();
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!memberId) {
    return memberManagementFailure_('memberIdRequired');
  }

  if (typeof submission.active !== 'boolean') {
    return memberManagementFailure_('activeInvalid');
  }

  let leaveDate = '';

  if (!submission.active) {
    leaveDate = parseDateOnlyInput_(leaveDateValue);

    if (!leaveDate) {
      return memberManagementFailure_('leaveDateRequired');
    }
  }

  if (!isValidMemberRequestId_(requestId)) {
    return memberManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      memberId: memberId,
      active: submission.active,
      leaveDate: leaveDate,
      requestId: requestId
    }
  };
}


function validateMemberDeleteSubmission_(submission) {
  if (!submission || typeof submission !== 'object') {
    return memberManagementFailure_('invalidSubmission');
  }

  const memberId = String(
    submission.memberId || ''
  ).trim();
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!memberId) {
    return memberManagementFailure_('memberIdRequired');
  }

  if (!isValidMemberRequestId_(requestId)) {
    return memberManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      memberId: memberId,
      requestId: requestId
    }
  };
}


function validateMemberAccessChange_(
  teacher,
  existingRow,
  proposedValue,
  values,
  headers,
  selfAccessConfirmation
) {
  const wasActiveTeacher = isActiveTeacher_(existingRow);
  const remainsActiveTeacher =
    proposedValue.active === true &&
    proposedValue.role === CONFIG.ROLES.TEACHER;

  if (
    wasActiveTeacher &&
    !remainsActiveTeacher &&
    countActiveTeachers_(values, headers) <= 1
  ) {
    return memberManagementFailure_('finalActiveTeacher');
  }

  const teacherEmail = normalizeMemberEmail_(teacher.Email);
  const existingEmail = normalizeMemberEmail_(existingRow.Email);
  const teacherId = String(
    teacher['Member ID'] || ''
  ).trim();
  const existingId = String(
    existingRow['Member ID'] || ''
  ).trim();
  const isSelf = Boolean(
    (teacherId && teacherId === existingId) ||
    (teacherEmail && teacherEmail === existingEmail)
  );
  const removesOwnAccess = isSelf && (
    proposedValue.active !== true ||
    proposedValue.role !== CONFIG.ROLES.TEACHER ||
    proposedValue.email !== teacherEmail
  );

  if (
    removesOwnAccess &&
    normalizeMemberEmail_(selfAccessConfirmation) !==
      teacherEmail
  ) {
    return {
      success: false,
      errorCode: 'selfAccessConfirmationRequired',
      requiresSelfConfirmation: true
    };
  }

  return { success: true };
}


function getMemberManagementSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(
    CONFIG.SHEETS.MEMBERS
  );

  if (!sheet) {
    throw new Error('The Members sheet could not be found.');
  }

  const values = sheet.getDataRange().getValues();

  if (values.length === 0) {
    throw new Error(
      'The Members sheet does not have a header row.'
    );
  }

  const headers = values[0].map(header =>
    String(header).trim()
  );
  const missingHeaders = MEMBER_MANAGEMENT_HEADERS_
    .filter(header => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(
      'The Members sheet is missing required columns.'
    );
  }

  return {
    sheet: sheet,
    headers: headers,
    values: values
  };
}


function getMemberManagementRoles_() {
  return [
    CONFIG.ROLES.STUDENT,
    CONFIG.ROLES.CLUB_LEADER,
    CONFIG.ROLES.TEACHER
  ];
}


function mapManagedMemberForClient_(row, teacherEmail) {
  const email = normalizeMemberEmail_(row.Email);

  return {
    memberId: String(row['Member ID'] || '').trim(),
    name: String(row.Name || ''),
    email: email,
    grade: String(row.Grade || ''),
    role: String(row.Role || '').trim(),
    active: isTrue_(row.Active),
    joinDateValue: formatDateOnly_(
      row['Join Date'],
      getTimeZone_()
    ),
    leaveDateValue: formatDateOnly_(
      row['Leave Date'],
      getTimeZone_()
    ),
    isCurrentUser: Boolean(
      email && email === teacherEmail
    )
  };
}


function compareManagedMembers_(a, b) {
  if (a.active !== b.active) {
    return a.active ? -1 : 1;
  }

  return a.name.localeCompare(b.name, 'ja') ||
    a.email.localeCompare(b.email) ||
    a.memberId.localeCompare(b.memberId);
}


function buildMemberRowObject_(memberId, value) {
  return {
    'Member ID': memberId,
    'Name': value.name,
    'Email': value.email,
    'Grade': value.grade,
    'Role': value.role,
    'Active': value.active,
    'Join Date': value.joinDate,
    'Leave Date': value.leaveDate
  };
}


function findMemberRows_(memberId, values, headers) {
  const idIndex = headers.indexOf('Member ID');
  const matches = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    if (
      String(values[rowIndex][idIndex] || '').trim() ===
        memberId
    ) {
      matches.push({ rowIndex: rowIndex });
    }
  }

  return matches;
}


function hasMemberEmail_(
  values,
  headers,
  email,
  excludedMemberId
) {
  const idIndex = headers.indexOf('Member ID');
  const emailIndex = headers.indexOf('Email');

  return values.slice(1).some(row =>
    normalizeMemberEmail_(row[emailIndex]) === email &&
    String(row[idIndex] || '').trim() !== excludedMemberId
  );
}


function generateMemberId_(values, headers) {
  const idIndex = headers.indexOf('Member ID');
  const existingIds = new Set();
  let highestNumber = 0;

  values.slice(1).forEach(row => {
    const memberId = String(row[idIndex] || '').trim();
    const match = memberId.match(/^M(\d+)$/);

    existingIds.add(memberId);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1])
      );
    }
  });

  let nextNumber = highestNumber + 1;
  let candidate = '';

  do {
    candidate = `M${String(nextNumber).padStart(3, '0')}`;
    nextNumber++;
  } while (existingIds.has(candidate));

  return candidate;
}


function countActiveTeachers_(values, headers) {
  return values
    .slice(1)
    .map(row => rowToObject_(headers, row))
    .filter(isActiveTeacher_)
    .length;
}


function isActiveTeacher_(member) {
  return isTrue_(member.Active) &&
    String(member.Role || '').trim() ===
      CONFIG.ROLES.TEACHER;
}


function getLinkedMemberRecordCounts_(member) {
  const memberId = String(
    member['Member ID'] || ''
  ).trim();
  const email = normalizeMemberEmail_(member.Email);

  return {
    availability: countMemberRows_(
      CONFIG.SHEETS.AVAILABILITY,
      memberId,
      email
    ),
    volunteers: countMemberRows_(
      CONFIG.SHEETS.VOLUNTEERS,
      memberId,
      email
    ),
    attendance: countMemberRows_(
      CONFIG.SHEETS.ATTENDANCE,
      memberId,
      email
    )
  };
}


function countMemberRows_(sheetName, memberId, email) {
  return getSheetObjects_(sheetName).filter(row => {
    const rowMemberId = String(
      row['Member ID'] || ''
    ).trim();
    const rowEmail = normalizeMemberEmail_(
      row['Student Email'] || row.Email
    );

    return Boolean(
      (memberId && rowMemberId === memberId) ||
      (email && rowEmail === email)
    );
  }).length;
}


function normalizeMemberEmail_(value) {
  return String(value || '').trim().toLowerCase();
}


function isValidMemberEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


function isValidMemberRequestId_(requestId) {
  return Boolean(
    requestId &&
    requestId.length <= 100 &&
    /^[A-Za-z0-9_-]+$/.test(requestId)
  );
}


function getMemberRequestResult_(
  teacher,
  operation,
  requestId
) {
  const cached = CacheService.getScriptCache().get(
    getMemberRequestCacheKey_(
      teacher,
      operation,
      requestId
    )
  );

  return cached ? JSON.parse(cached) : null;
}


function cacheMemberRequestResult_(
  teacher,
  operation,
  requestId,
  result
) {
  CacheService.getScriptCache().put(
    getMemberRequestCacheKey_(
      teacher,
      operation,
      requestId
    ),
    JSON.stringify(result),
    600
  );
}


function getMemberRequestCacheKey_(
  teacher,
  operation,
  requestId
) {
  return `member-${operation}:${
    normalizeMemberEmail_(teacher.Email)
  }:${requestId}`;
}


function memberManagementFailure_(errorCode) {
  return {
    success: false,
    errorCode: errorCode
  };
}
