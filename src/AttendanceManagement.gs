const ATTENDANCE_HEADERS_ = Object.freeze([
  'Session ID',
  'Member ID',
  'Student Email',
  'Attendance Status',
  'Check-in Time',
  'Method',
  'Teacher Note'
]);


/**
 * Returns Teacher-only attendance data for a Today or past session.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function getAttendanceSession(sessionId) {
  requireAttendanceTeacherAccess_();
  const sessionRow = getAttendanceSessionRow_(sessionId);
  const classification = classifySessionDate_(sessionRow.Date);

  if (classification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING) {
    throw new Error('Attendance is not available for future sessions.');
  }

  return buildAttendanceSessionForTeacher_(sessionRow);
}


/**
 * Creates or updates one manual attendance row.
 *
 * @param {Object} submission
 * @return {Object}
 */
function saveManualAttendance(submission) {
  requireAttendanceTeacherAccess_();
  const input = validateManualAttendanceSubmission_(submission);
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const sessionRow = getWritableAttendanceSession_(input.sessionId);
    const member = getWritableAttendanceMember_(input.memberId);
    const sheetData = getAttendanceSheetData_();
    const matches = findAttendanceSheetMatches_(
      sheetData.rows,
      input.sessionId,
      input.memberId,
      normalizeAttendanceEmail_(member.Email)
    );

    if (matches.length > 1) {
      throw new Error(
        'Duplicate attendance rows exist for this member and session.'
      );
    }

    const existing = matches[0] || null;
    const rowObject = buildManualAttendanceRow_(
      input,
      sessionRow,
      member,
      existing ? existing.record : null
    );

    if (existing) {
      const rowValues = existing.values.slice();

      ATTENDANCE_HEADERS_.forEach(header => {
        rowValues[sheetData.headerIndexes[header]] = rowObject[header];
      });

      sheetData.sheet.getRange(
        existing.rowIndex,
        1,
        1,
        sheetData.headers.length
      ).setValues([rowValues]);
    } else {
      sheetData.sheet.appendRow(
        sheetData.headers.map(header =>
          Object.prototype.hasOwnProperty.call(rowObject, header)
            ? rowObject[header]
            : ''
        )
      );
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      operation: existing ? 'updated' : 'created',
      attendance: mapAttendanceRowForClient_(rowObject)
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Clears one exact manual attendance row after explicit confirmation.
 *
 * @param {Object} submission
 * @return {Object}
 */
function clearManualAttendance(submission) {
  requireAttendanceTeacherAccess_();
  const input = submission && typeof submission === 'object'
    ? submission
    : {};
  const sessionId = String(input.sessionId || '').trim();
  const memberId = String(input.memberId || '').trim();

  if (!sessionId || !memberId || input.confirmed !== true) {
    throw new Error('The attendance clear request is invalid.');
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    getWritableAttendanceSession_(sessionId);
    const member = getWritableAttendanceMember_(memberId);
    const sheetData = getAttendanceSheetData_();
    const matches = findAttendanceSheetMatches_(
      sheetData.rows,
      sessionId,
      memberId,
      normalizeAttendanceEmail_(member.Email)
    );

    if (matches.length > 1) {
      throw new Error(
        'Duplicate attendance rows exist for this member and session.'
      );
    }

    if (!matches.length) {
      return { success: true, operation: 'notFound' };
    }

    sheetData.sheet.deleteRow(matches[0].rowIndex);
    SpreadsheetApp.flush();

    return { success: true, operation: 'cleared' };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Marks every expected member without an attendance row Present.
 * Existing records and Unavailable members are never overwritten.
 *
 * @param {Object} submission
 * @return {Object}
 */
function markAllExpectedPresent(submission) {
  requireAttendanceTeacherAccess_();
  const input = submission && typeof submission === 'object'
    ? submission
    : {};
  const sessionId = String(input.sessionId || '').trim();

  if (!sessionId || input.confirmed !== true) {
    throw new Error('The bulk attendance request is invalid.');
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);
    const sessionRow = getWritableAttendanceSession_(sessionId);

    if (
      classifySessionDate_(sessionRow.Date) !==
        SESSION_DATE_CLASSIFICATIONS_.TODAY
    ) {
      throw new Error('Bulk attendance is available only for Today.');
    }

    const members = getActiveAttendingMembers_();
    const availabilityRows = getSheetObjects_(CONFIG.SHEETS.AVAILABILITY);
    const sheetData = getAttendanceSheetData_();
    const now = new Date();
    const rowsToCreate = [];
    const seenMemberIds = new Set();
    let skipped = 0;
    let failed = 0;

    members.forEach(member => {
      const memberId = String(member['Member ID'] || '').trim();
      const email = normalizeAttendanceEmail_(member.Email);

      if (!memberId || seenMemberIds.has(memberId)) {
        failed += 1;
        return;
      }

      seenMemberIds.add(memberId);
      const availability = findCurrentAvailabilityRow_(
        sessionId,
        memberId,
        email,
        availabilityRows
      );
      const response = String(
        availability ? availability.Response || '' : ''
      ).trim();

      if (response === CONFIG.AVAILABILITY.UNAVAILABLE) {
        skipped += 1;
        return;
      }

      const matches = findAttendanceSheetMatches_(
        sheetData.rows,
        sessionId,
        memberId,
        email
      );

      if (matches.length > 1) {
        failed += 1;
        return;
      }

      if (matches.length === 1) {
        skipped += 1;
        return;
      }

      rowsToCreate.push({
        'Session ID': sessionId,
        'Member ID': memberId,
        'Student Email': email,
        'Attendance Status': CONFIG.ATTENDANCE_STATUSES.PRESENT,
        'Check-in Time': now,
        Method: CONFIG.ATTENDANCE_METHODS.TEACHER_MANUAL,
        'Teacher Note': ''
      });
    });

    if (rowsToCreate.length > 0) {
      const values = rowsToCreate.map(row =>
        sheetData.headers.map(header =>
          Object.prototype.hasOwnProperty.call(row, header)
            ? row[header]
            : ''
        )
      );

      sheetData.sheet.getRange(
        sheetData.sheet.getLastRow() + 1,
        1,
        values.length,
        sheetData.headers.length
      ).setValues(values);
      SpreadsheetApp.flush();
    }

    return {
      success: failed === 0,
      created: rowsToCreate.length,
      skipped: skipped,
      failed: failed
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Returns one bounded page of past attendance summaries for Teachers.
 *
 * @param {Object=} filters
 * @return {Object}
 */
function getAttendanceHistory(filters) {
  requireAttendanceTeacherAccess_();
  const query = resolveManagementHistoryQuery_(filters);
  const sessionRows = getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row =>
      classifySessionDate_(row.Date) ===
        SESSION_DATE_CLASSIFICATIONS_.PAST &&
      isDateInHistoryQuery_(getDateOnlyValue_(row.Date), query)
    )
    .sort(compareSessionsReverseChronologically_);
  const page = buildHistoryPage_(
    sessionRows,
    query.offset,
    query.limit
  );
  const context = {
    members: getActiveAttendingMembers_(),
    availabilityRows: getSheetObjects_(CONFIG.SHEETS.AVAILABILITY),
    attendanceRows: getSheetObjects_(CONFIG.SHEETS.ATTENDANCE)
  };

  return {
    sessions: page.items.map(row => ({
      ...mapSessionForClient_(row, getTimeZone_()),
      active: isTrue_(row.Active),
      cancelled: String(row['Session Type'] || '').trim() ===
        CONFIG.SESSION_TYPES.CANCELLED,
      summary: buildAttendanceHistorySummary_(row, context)
    })),
    historyQuery: {
      historyScope: query.historyScope,
      fromDateValue: query.fromDateValue,
      toDateValue: query.toDateValue,
      schoolYear: query.schoolYear
    },
    page: {
      offset: page.offset,
      nextOffset: page.nextOffset,
      hasMore: page.hasMore,
      total: page.total
    }
  };
}


/**
 * Returns a selected historical attendance roster for a Teacher.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function getAttendanceHistorySession(sessionId) {
  requireAttendanceTeacherAccess_();
  const sessionRow = getAttendanceSessionRow_(sessionId);

  if (
    classifySessionDate_(sessionRow.Date) !==
      SESSION_DATE_CLASSIFICATIONS_.PAST
  ) {
    throw new Error('The selected session is not in attendance history.');
  }

  return buildAttendanceSessionForTeacher_(sessionRow);
}


function requireAttendanceTeacherAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canRecordAttendance) {
    throw new Error(
      'You do not have permission to manage attendance.'
    );
  }

  return member;
}


function validateManualAttendanceSubmission_(submission) {
  if (!submission || typeof submission !== 'object') {
    throw new Error('No attendance information was received.');
  }

  const value = {
    sessionId: String(submission.sessionId || '').trim(),
    memberId: String(submission.memberId || '').trim(),
    status: String(submission.status || '').trim(),
    checkInTime: String(submission.checkInTime || '').trim(),
    clearCheckInTime: submission.clearCheckInTime === true,
    hasTeacherNote: Object.prototype.hasOwnProperty.call(
      submission,
      'teacherNote'
    ),
    teacherNote: String(submission.teacherNote || '')
  };

  if (!value.sessionId || !value.memberId) {
    throw new Error('The session or member could not be identified.');
  }
  if (!isApprovedAttendanceStatus_(value.status)) {
    throw new Error('Select a valid attendance status.');
  }
  if (value.teacherNote.length > CONFIG.ATTENDANCE_NOTE_MAX_LENGTH) {
    throw new Error('The Teacher Note is too long.');
  }
  if (value.checkInTime && !/^\d{2}:\d{2}$/.test(value.checkInTime)) {
    throw new Error('Enter a valid Check-in Time.');
  }

  return value;
}


function getAttendanceSessionRow_(sessionId) {
  const normalizedId = String(sessionId || '').trim();
  const matches = getSheetObjects_(CONFIG.SHEETS.SESSIONS).filter(row =>
    String(row['Session ID'] || '').trim() === normalizedId
  );

  if (!normalizedId || matches.length !== 1) {
    throw new Error(
      matches.length > 1
        ? 'Duplicate Session IDs exist.'
        : 'The selected session could not be found.'
    );
  }

  return matches[0];
}


function getWritableAttendanceSession_(sessionId) {
  const session = getAttendanceSessionRow_(sessionId);
  const classification = classifySessionDate_(session.Date);

  if (
    !isTrue_(session.Active) ||
    String(session['Session Type'] || '').trim() ===
      CONFIG.SESSION_TYPES.CANCELLED
  ) {
    throw new Error('Attendance cannot be changed for this session.');
  }
  if (!classification) {
    throw new Error('The selected session has an invalid date.');
  }
  if (classification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING) {
    throw new Error('Attendance cannot be recorded before the session.');
  }

  return session;
}


function getWritableAttendanceMember_(memberId) {
  const normalizedId = String(memberId || '').trim();
  const matches = getSheetObjects_(CONFIG.SHEETS.MEMBERS).filter(member =>
    String(member['Member ID'] || '').trim() === normalizedId
  );

  if (!normalizedId || matches.length !== 1) {
    throw new Error(
      matches.length > 1
        ? 'Duplicate Member IDs exist.'
        : 'The selected member could not be found.'
    );
  }

  const member = matches[0];
  const role = String(member.Role || '').trim();

  if (
    !isTrue_(member.Active) ||
    ![
      CONFIG.ROLES.STUDENT,
      CONFIG.ROLES.CLUB_LEADER
    ].includes(role)
  ) {
    throw new Error(
      'Only active Students and Club Leaders may receive attendance.'
    );
  }

  return member;
}


function buildManualAttendanceRow_(input, session, member, existing) {
  const clearsTime = [
    CONFIG.ATTENDANCE_STATUSES.ABSENT,
    CONFIG.ATTENDANCE_STATUSES.EXCUSED
  ].includes(input.status);
  let checkInTime = '';

  if (!clearsTime && !input.clearCheckInTime) {
    checkInTime = input.checkInTime
      ? parseAttendanceTimeForSession_(input.checkInTime, session.Date)
      : getPreservedAttendanceTime_(
          existing ? existing['Check-in Time'] : '',
          session.Date
        );

    if (
      !checkInTime &&
      input.status === CONFIG.ATTENDANCE_STATUSES.PRESENT &&
      classifySessionDate_(session.Date) ===
        SESSION_DATE_CLASSIFICATIONS_.TODAY
    ) {
      checkInTime = new Date();
    }
  }

  return {
    'Session ID': input.sessionId,
    'Member ID': input.memberId,
    'Student Email': normalizeAttendanceEmail_(member.Email),
    'Attendance Status': input.status,
    'Check-in Time': checkInTime,
    Method: CONFIG.ATTENDANCE_METHODS.TEACHER_MANUAL,
    'Teacher Note': input.hasTeacherNote
      ? input.teacherNote
      : String(existing ? existing['Teacher Note'] || '' : '')
  };
}


function parseAttendanceTimeForSession_(timeValue, sessionDate) {
  const match = String(timeValue || '').match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    throw new Error('Enter a valid Check-in Time.');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const dateValue = getDateOnlyValue_(sessionDate);

  if (hours > 23 || minutes > 59 || !dateValue) {
    throw new Error('Enter a valid Check-in Time.');
  }

  const parsed = new Date(
    `${dateValue}T${match[1]}:${match[2]}:00+09:00`
  );

  if (isNaN(parsed.getTime())) {
    throw new Error('Enter a valid Check-in Time.');
  }

  return parsed;
}


function getPreservedAttendanceTime_(value, sessionDate) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return getDateOnlyValue_(value) < '2000-01-01'
      ? parseAttendanceTimeForSession_(
          formatTime_(value, getTimeZone_()),
          sessionDate
        )
      : value;
  }

  const text = String(value || '').trim();

  if (/^\d{2}:\d{2}$/.test(text)) {
    return parseAttendanceTimeForSession_(text, sessionDate);
  }

  const parsed = text ? new Date(text) : null;
  return parsed && !isNaN(parsed.getTime()) ? parsed : '';
}


function getAttendanceSheetData_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEETS.ATTENDANCE);

  if (!sheet) {
    throw new Error('The Attendance sheet could not be found.');
  }

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const headers = values[0].map(header => String(header).trim());
  const headerIndexes = {};

  ATTENDANCE_HEADERS_.forEach(header => {
    const index = headers.indexOf(header);

    if (index < 0) {
      throw new Error(`The Attendance sheet is missing "${header}".`);
    }

    headerIndexes[header] = index;
  });

  const rows = values.slice(1).map((row, index) => {
    const record = {};
    headers.forEach((header, column) => {
      record[header] = row[column];
    });
    return {
      rowIndex: index + 2,
      values: row,
      record: record
    };
  }).filter(row => row.values.some(value => value !== ''));

  return {
    sheet: sheet,
    headers: headers,
    headerIndexes: headerIndexes,
    rows: rows
  };
}


function findAttendanceSheetMatches_(rows, sessionId, memberId, email) {
  const normalizedEmail = normalizeAttendanceEmail_(email);

  return (rows || []).filter(rowData => {
    const row = rowData.record;

    if (
      String(row['Session ID'] || '').trim() !==
        String(sessionId || '').trim()
    ) {
      return false;
    }

    const rowMemberId = String(row['Member ID'] || '').trim();

    return rowMemberId
      ? rowMemberId === String(memberId || '').trim()
      : Boolean(
          normalizedEmail &&
          normalizeAttendanceEmail_(row['Student Email']) ===
            normalizedEmail
        );
  });
}


function mapAttendanceRowForClient_(row) {
  return {
    status: String(row['Attendance Status'] || ''),
    checkInTime: formatDateTime_(
      row['Check-in Time'],
      getTimeZone_()
    ),
    method: String(row.Method || ''),
    teacherNote: String(row['Teacher Note'] || '')
  };
}


function buildAttendanceSessionForTeacher_(sessionRow) {
  const data = buildTodaySessionData_(sessionRow['Session ID']);
  const classification = classifySessionDate_(sessionRow.Date);

  return {
    ...data,
    editable: Boolean(
      isTrue_(sessionRow.Active) &&
      String(sessionRow['Session Type'] || '').trim() !==
        CONFIG.SESSION_TYPES.CANCELLED &&
      classification !== SESSION_DATE_CLASSIFICATIONS_.UPCOMING
    )
  };
}


function buildAttendanceHistorySummary_(sessionRow, context) {
  const sessionId = String(sessionRow['Session ID'] || '').trim();
  const records = context.members.map(member => {
    const memberId = String(member['Member ID'] || '').trim();
    const email = normalizeAttendanceEmail_(member.Email);
    const availability = findCurrentAvailabilityRow_(
      sessionId,
      memberId,
      email,
      context.availabilityRows
    );
    const attendance = findAttendanceRowForMember_(
      context.attendanceRows,
      sessionId,
      memberId,
      email
    );

    return {
      availability: String(
        availability ? availability.Response || '' : ''
      ).trim(),
      attendance: attendance
        ? { status: String(attendance['Attendance Status'] || '').trim() }
        : null,
      volunteer: null
    };
  });

  return createTodaySummary_(records);
}


function normalizeAttendanceEmail_(value) {
  return String(value || '').trim().toLowerCase();
}
