const SESSION_MANAGEMENT_HEADERS_ = Object.freeze([
  'Session ID',
  'Date',
  'Title',
  'Session Type',
  'Start Time',
  'End Time',
  'Response Deadline',
  'Active',
  'Notes'
]);

const MANAGED_SESSION_LIFECYCLES_ = Object.freeze({
  TODAY: 'Today',
  UPCOMING: 'Upcoming',
  PAST: 'Past',
  CANCELLED: 'Cancelled'
});

/**
 * Returns one server-filtered page for the Teacher management view.
 *
 * @param {Object=} filters
 * @return {Object}
 */
function getSessionManagementData(filters) {
  requireSessionTeacherAccess_();
  const input = filters && typeof filters === 'object'
    ? filters
    : {};
  const query = resolveManagementHistoryQuery_(input);

  const timeZone = getTimeZone_();
  const todayDateValue = formatDateOnly_(
    new Date(),
    timeZone
  );
  getSessionManagementSheet_();

  const search = String(input.search || '').trim().toLowerCase();
  const sessionType = String(input.sessionType || '').trim();
  const status = String(input.status || '').trim();
  const sessions = getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  )
    .filter(row =>
      isDateInHistoryQuery_(getDateOnlyValue_(row.Date), query)
    )
    .map(row => mapManagedSessionForClient_(
      row,
      timeZone
    ))
    .filter(session => Boolean(
      (!search || session.title.toLowerCase().includes(search)) &&
      (!sessionType || session.sessionType === sessionType) &&
      (!status ||
        (status === 'active' && session.active) ||
        (status === 'inactive' && !session.active))
    ))
    .sort((a, b) =>
      compareManagedSessions_(
        a,
        b,
        todayDateValue
      )
    );
  const page = buildHistoryPage_(
    sessions,
    query.offset,
    query.limit
  );

  return {
    sessions: page.items,
    sessionTypes: getSessionManagementTypes_(),
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


function compareManagedSessions_(a, b, todayDateValue) {
  const aLifecycle = a.lifecycle ||
    classifyManagedSessionLifecycle_(a, todayDateValue);
  const bLifecycle = b.lifecycle ||
    classifyManagedSessionLifecycle_(b, todayDateValue);
  const ranks = {
    [MANAGED_SESSION_LIFECYCLES_.TODAY]: 0,
    [MANAGED_SESSION_LIFECYCLES_.UPCOMING]: 1,
    [MANAGED_SESSION_LIFECYCLES_.CANCELLED]: 2,
    [MANAGED_SESSION_LIFECYCLES_.PAST]: 3
  };
  const rankComparison = ranks[aLifecycle] - ranks[bLifecycle];

  if (rankComparison) {
    return rankComparison;
  }

  if (aLifecycle === MANAGED_SESSION_LIFECYCLES_.TODAY) {
    return a.startTime.localeCompare(b.startTime) ||
      a.sessionId.localeCompare(b.sessionId);
  }

  const dateComparison = aLifecycle ===
    MANAGED_SESSION_LIFECYCLES_.UPCOMING
    ? a.dateValue.localeCompare(b.dateValue)
    : b.dateValue.localeCompare(a.dateValue);

  return dateComparison ||
    a.startTime.localeCompare(b.startTime) ||
    a.sessionId.localeCompare(b.sessionId);
}


/**
 * Classifies a managed session using the Tokyo calendar and existing
 * cancellation rules. Administrative inactivity takes precedence over
 * the calendar classification.
 *
 * @param {Object} session
 * @param {string=} todayDateValue
 * @return {string}
 */
function classifyManagedSessionLifecycle_(session, todayDateValue) {
  const sessionType = String(
    session.sessionType || session['Session Type'] || ''
  ).trim();
  const active = Object.prototype.hasOwnProperty.call(session, 'active')
    ? session.active === true
    : isTrue_(session.Active);

  if (
    !active ||
    sessionType === CONFIG.SESSION_TYPES.CANCELLED
  ) {
    return MANAGED_SESSION_LIFECYCLES_.CANCELLED;
  }

  return classifySessionDate_(
    session.dateValue || session.Date,
    todayDateValue
  );
}


/**
 * Creates a session with a server-generated ID.
 *
 * @param {Object} submission
 * @return {Object}
 */
function createSession(submission) {
  const teacher = requireSessionTeacherAccess_();
  const validation = validateSessionSubmission_(
    submission,
    true
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getSessionRequestResult_(
      teacher,
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getSessionManagementSheet_();
    const sessionId = generateSessionId_(
      validation.value.dateValue,
      validation.value.sessionType,
      sheetData.values,
      sheetData.headers
    );

    const rowObject = buildSessionRowObject_(
      sessionId,
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
      session: mapManagedSessionForClient_(
        rowObject,
        getTimeZone_()
      )
    };

    cacheSessionRequestResult_(
      teacher,
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Updates an existing session without changing its ID.
 *
 * @param {Object} submission
 * @return {Object}
 */
function updateSession(submission) {
  const teacher = requireSessionTeacherAccess_();
  const validation = validateSessionSubmission_(
    submission,
    false
  );

  if (!validation.success) {
    return validation;
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const cached = getSessionRequestResult_(
      teacher,
      validation.value.requestId
    );

    if (cached) {
      return cached;
    }

    const sheetData = getSessionManagementSheet_();
    const matches = findSessionRows_(
      validation.value.sessionId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return sessionManagementFailure_(
        'sessionNotFound'
      );
    }

    if (matches.length > 1) {
      return sessionManagementFailure_(
        'duplicateSessionId'
      );
    }

    const match = matches[0];
    const rowObject = buildSessionRowObject_(
      validation.value.sessionId,
      validation.value
    );
    const existingRow = sheetData.values[match.rowIndex];
    const newRow = sheetData.headers.map(
      (header, index) =>
        Object.prototype.hasOwnProperty.call(
          rowObject,
          header
        )
          ? rowObject[header]
          : existingRow[index]
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
      session: mapManagedSessionForClient_(
        rowObject,
        getTimeZone_()
      )
    };

    cacheSessionRequestResult_(
      teacher,
      validation.value.requestId,
      result
    );

    return result;
  } finally {
    lock.releaseLock();
  }
}


/**
 * Cancels a session while preserving linked records.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function cancelSession(sessionId) {
  requireSessionTeacherAccess_();

  const normalizedId = String(sessionId || '').trim();

  if (!normalizedId) {
    return sessionManagementFailure_('sessionIdRequired');
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const sheetData = getSessionManagementSheet_();
    const matches = findSessionRows_(
      normalizedId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return sessionManagementFailure_('sessionNotFound');
    }

    if (matches.length > 1) {
      return sessionManagementFailure_(
        'duplicateSessionId'
      );
    }

    const match = matches[0];
    const typeIndex = sheetData.headers.indexOf(
      'Session Type'
    );
    const activeIndex = sheetData.headers.indexOf('Active');
    const newRow = [...sheetData.values[match.rowIndex]];

    newRow[typeIndex] = CONFIG.SESSION_TYPES.CANCELLED;
    newRow[activeIndex] = false;

    sheetData.sheet
      .getRange(
        match.rowIndex + 1,
        1,
        1,
        newRow.length
      )
      .setValues([newRow]);

    SpreadsheetApp.flush();

    return {
      success: true,
      operation: 'cancelled',
      sessionId: normalizedId
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Permanently deletes a session only when no linked rows exist.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function deleteSession(sessionId) {
  requireSessionTeacherAccess_();

  const normalizedId = String(sessionId || '').trim();

  if (!normalizedId) {
    return sessionManagementFailure_('sessionIdRequired');
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const sheetData = getSessionManagementSheet_();
    const matches = findSessionRows_(
      normalizedId,
      sheetData.values,
      sheetData.headers
    );

    if (matches.length === 0) {
      return sessionManagementFailure_('sessionNotFound');
    }

    if (matches.length > 1) {
      return sessionManagementFailure_(
        'duplicateSessionId'
      );
    }

    const linkedRecords = getLinkedSessionRecordCounts_(
      normalizedId
    );
    const linkedTotal = Object.values(linkedRecords)
      .reduce((total, count) => total + count, 0);

    if (linkedTotal > 0) {
      return {
        success: false,
        errorCode: 'linkedRecords',
        canCancel: true,
        linkedRecords: linkedRecords
      };
    }

    sheetData.sheet.deleteRow(
      matches[0].rowIndex + 1
    );
    SpreadsheetApp.flush();

    return {
      success: true,
      operation: 'deleted',
      sessionId: normalizedId
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Requires the signed-in user to be an active Teacher.
 *
 * @return {Object}
 */
function requireSessionTeacherAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canManageSessions) {
    throw new Error(
      'You do not have permission to manage sessions.'
    );
  }

  return member;
}


/**
 * Validates and normalizes a create or update submission.
 *
 * @param {Object} submission
 * @param {boolean} creating
 * @return {Object}
 */
function validateSessionSubmission_(submission, creating) {
  if (!submission || typeof submission !== 'object') {
    return sessionManagementFailure_('invalidSubmission');
  }

  const sessionId = String(
    submission.sessionId || ''
  ).trim();
  const title = String(submission.title || '').trim();
  const dateValue = String(
    submission.dateValue || ''
  ).trim();
  const sessionType = String(
    submission.sessionType || ''
  ).trim();
  const startTime = String(
    submission.startTime || ''
  ).trim();
  const endTime = String(
    submission.endTime || ''
  ).trim();
  const responseDeadline = String(
    submission.responseDeadline || ''
  ).trim();
  const notes = String(submission.notes || '');
  const requestId = String(
    submission.requestId || ''
  ).trim();

  if (!creating && !sessionId) {
    return sessionManagementFailure_('sessionIdRequired');
  }

  if (!title) {
    return sessionManagementFailure_('titleRequired');
  }

  if (!dateValue) {
    return sessionManagementFailure_('dateRequired');
  }

  const sessionDate = parseDateOnlyInput_(dateValue);

  if (!sessionDate) {
    return sessionManagementFailure_('dateInvalid');
  }

  if (!getSessionManagementTypes_().includes(sessionType)) {
    return sessionManagementFailure_('sessionTypeInvalid');
  }

  if (startTime && !isValidSessionTime_(startTime)) {
    return sessionManagementFailure_('startTimeInvalid');
  }

  if (endTime && !isValidSessionTime_(endTime)) {
    return sessionManagementFailure_('endTimeInvalid');
  }

  if (
    startTime &&
    endTime &&
    timeToMinutes_(endTime) < timeToMinutes_(startTime)
  ) {
    return sessionManagementFailure_('endBeforeStart');
  }

  let deadlineDate = '';

  if (responseDeadline) {
    deadlineDate = parseTokyoDateTimeInput_(
      responseDeadline
    );

    if (!deadlineDate) {
      return sessionManagementFailure_('deadlineInvalid');
    }
  }

  if (
    deadlineDate &&
    startTime &&
    deadlineDate.getTime() >
      parseTokyoDateTimeInput_(
        `${dateValue}T${startTime}`
      ).getTime() &&
    submission.allowLateDeadline !== true
  ) {
    return {
      success: false,
      errorCode: 'deadlineAfterStart',
      requiresConfirmation: true
    };
  }

  if (typeof submission.active !== 'boolean') {
    return sessionManagementFailure_('activeInvalid');
  }

  if (
    !requestId ||
    requestId.length > 100 ||
    !/^[A-Za-z0-9_-]+$/.test(requestId)
  ) {
    return sessionManagementFailure_('requestIdInvalid');
  }

  return {
    success: true,
    value: {
      sessionId: sessionId,
      title: title,
      dateValue: dateValue,
      sessionDate: sessionDate,
      sessionType: sessionType,
      startTime: startTime,
      endTime: endTime,
      responseDeadline: deadlineDate,
      active: submission.active,
      notes: notes,
      requestId: requestId
    }
  };
}


function isValidSessionTime_(value) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}


function getSessionManagementTypes_() {
  return [
    CONFIG.SESSION_TYPES.REGULAR,
    CONFIG.SESSION_TYPES.EVENT,
    CONFIG.SESSION_TYPES.CANCELLED
  ];
}


function timeToMinutes_(value) {
  const parts = value.split(':');
  return Number(parts[0]) * 60 + Number(parts[1]);
}


function buildSessionRowObject_(sessionId, value) {
  return {
    'Session ID': sessionId,
    'Date': value.sessionDate,
    'Title': value.title,
    'Session Type': value.sessionType,
    'Start Time': value.startTime,
    'End Time': value.endTime,
    'Response Deadline': value.responseDeadline,
    'Active': value.active,
    'Notes': value.notes
  };
}


function mapManagedSessionForClient_(row, timeZone) {
  return {
    ...mapSessionForClient_(row, timeZone),
    active: isTrue_(row.Active),
    lifecycle: classifyManagedSessionLifecycle_(row)
  };
}


function getSessionManagementSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(
    CONFIG.SHEETS.SESSIONS
  );

  if (!sheet) {
    throw new Error('The Sessions sheet could not be found.');
  }

  const values = sheet.getDataRange().getValues();

  if (values.length === 0) {
    throw new Error(
      'The Sessions sheet does not have a header row.'
    );
  }

  const headers = values[0].map(header =>
    String(header).trim()
  );
  const missingHeaders = SESSION_MANAGEMENT_HEADERS_
    .filter(header => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(
      'The Sessions sheet is missing required columns.'
    );
  }

  return {
    sheet: sheet,
    headers: headers,
    values: values
  };
}


function findSessionRows_(sessionId, values, headers) {
  const idIndex = headers.indexOf('Session ID');
  const matches = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    if (
      String(values[rowIndex][idIndex] || '').trim() ===
        sessionId
    ) {
      matches.push({ rowIndex: rowIndex });
    }
  }

  return matches;
}


function generateSessionId_(
  dateValue,
  sessionType,
  values,
  headers
) {
  const prefixes = {
    Regular: 'REG',
    Event: 'EVT',
    Cancelled: 'CAN'
  };
  const base = `${prefixes[sessionType]}-${
    dateValue.replace(/-/g, '')
  }`;
  const idIndex = headers.indexOf('Session ID');
  const existingIds = new Set(
    values.slice(1).map(row =>
      String(row[idIndex] || '').trim()
    )
  );

  if (!existingIds.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = '';

  do {
    candidate = `${base}-${String(suffix).padStart(2, '0')}`;
    suffix++;
  } while (existingIds.has(candidate));

  return candidate;
}


function getLinkedSessionRecordCounts_(sessionId) {
  return {
    availability: countSessionRows_(
      CONFIG.SHEETS.AVAILABILITY,
      sessionId
    ),
    volunteers: countSessionRows_(
      CONFIG.SHEETS.VOLUNTEERS,
      sessionId
    ),
    attendance: countSessionRows_(
      CONFIG.SHEETS.ATTENDANCE,
      sessionId
    )
  };
}


function countSessionRows_(sheetName, sessionId) {
  return getSheetObjects_(sheetName).filter(row =>
    String(row['Session ID'] || '').trim() === sessionId
  ).length;
}


function getSessionRequestResult_(teacher, requestId) {
  const cached = CacheService.getScriptCache().get(
    getSessionRequestCacheKey_(teacher, requestId)
  );

  return cached ? JSON.parse(cached) : null;
}


function cacheSessionRequestResult_(
  teacher,
  requestId,
  result
) {
  CacheService.getScriptCache().put(
    getSessionRequestCacheKey_(teacher, requestId),
    JSON.stringify(result),
    600
  );
}


function getSessionRequestCacheKey_(teacher, requestId) {
  return `session-save:${String(teacher.Email || '')}:${requestId}`;
}


function sessionManagementFailure_(errorCode) {
  return {
    success: false,
    errorCode: errorCode
  };
}
