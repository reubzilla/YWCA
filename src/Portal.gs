/**
 * Returns the initial portal data for the signed-in member.
 *
 * @return {Object}
 */
function getPortalData() {
  const member = getCurrentMember_();

  return {
    user: {
      name: String(member.Name || ''),
      email: String(member.Email || ''),
      grade: String(member.Grade || ''),
      role: String(member.Role || '')
    },
    permissions: getPermissions_(member),
    notifications: getNotifications_(member),
    sessions: getUpcomingSessions_(
      CONFIG.UPCOMING_WEEKS
    )
  };
}


/**
 * Returns editable current/future sessions and read-only history with
 * the current member's existing availability responses.
 *
 * @return {Object}
 */
function getAvailabilityPageData() {
  const member = getCurrentMember_();
  const sessionGroups = getAvailabilitySessions_(
    CONFIG.UPCOMING_WEEKS
  );

  const memberId = String(
    member['Member ID'] || ''
  ).trim();

  const email = String(member.Email || '')
    .trim()
    .toLowerCase();

  const responseRows = getSheetObjects_(
    CONFIG.SHEETS.AVAILABILITY
  );

  const responsesBySession = {};

  responseRows.forEach(row => {
    if (!memberMatches_(row, memberId, email)) {
      return;
    }

    const sessionId = String(
      row['Session ID'] || ''
    ).trim();

    if (!sessionId) {
      return;
    }

    responsesBySession[sessionId] = {
      response: String(row.Response || ''),
      reason: String(row.Reason || ''),
      submittedAt: formatDateTime_(
        row['Submitted At'],
        getTimeZone_()
      ),
      updatedAt: formatDateTime_(
        row['Updated At'],
        getTimeZone_()
      )
    };
  });

  const attachAvailability = session => ({
    ...session,
    availability:
      responsesBySession[session.sessionId] || {
        response: '',
        reason: '',
        submittedAt: '',
        updatedAt: ''
      }
  });

  return {
    sessions: sessionGroups.sessions.map(attachAvailability),
    history: sessionGroups.history.map(attachAvailability),
    todayDateValue: getTodayDateValue_()
  };
}


/**
 * Creates or updates the signed-in member's availability
 * response for one session.
 *
 * @param {Object} submission
 * @return {Object}
 */
function saveAvailability(submission) {
  const member = getCurrentMember_();

  if (
    !submission ||
    typeof submission !== 'object'
  ) {
    throw new Error(
      'No availability information was received.'
    );
  }

  const sessionId = String(
    submission.sessionId || ''
  ).trim();

  const response = String(
    submission.response || ''
  ).trim();

  const reason = String(
    submission.reason || ''
  ).trim();

  if (!sessionId) {
    throw new Error(
      'The session could not be identified.'
    );
  }

  const allowedResponses = [
    CONFIG.AVAILABILITY.AVAILABLE,
    CONFIG.AVAILABILITY.UNAVAILABLE,
    CONFIG.AVAILABILITY.UNSURE
  ];

  if (!allowedResponses.includes(response)) {
    throw new Error(
      'Please select Available, Unavailable, or Unsure.'
    );
  }

  if (reason.length > 500) {
    throw new Error(
      'The note must be 500 characters or fewer.'
    );
  }

  const session = getEditableSession_(sessionId);

  if (!session) {
    throw new Error(
      'This session is not available for responses.'
    );
  }

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet = spreadsheet.getSheetByName(
    CONFIG.SHEETS.AVAILABILITY
  );

  if (!sheet) {
    throw new Error(
      `The sheet "${CONFIG.SHEETS.AVAILABILITY}" ` +
      'could not be found.'
    );
  }

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const values = sheet.getDataRange().getValues();

    if (values.length === 0) {
      throw new Error(
        'The Availability sheet does not have a header row.'
      );
    }

    const headers = values[0].map(header =>
      String(header).trim()
    );

    validateAvailabilityHeaders_(headers);

    const memberId = String(
      member['Member ID'] || ''
    ).trim();

    const email = String(member.Email || '')
      .trim()
      .toLowerCase();

    const now = new Date();

    let matchingRowNumber = null;
    let matchingRowValues = null;
    let originalSubmittedAt = now;

    for (
      let rowIndex = 1;
      rowIndex < values.length;
      rowIndex++
    ) {
      const rowObject = rowToObject_(
        headers,
        values[rowIndex]
      );

      const rowSessionId = String(
        rowObject['Session ID'] || ''
      ).trim();

      if (
        rowSessionId === sessionId &&
        memberMatches_(
          rowObject,
          memberId,
          email
        )
      ) {
        matchingRowNumber = rowIndex + 1;
        matchingRowValues = values[rowIndex];

        originalSubmittedAt =
          parseDateTime_(
            rowObject['Submitted At']
          ) || now;

        break;
      }
    }

    const newRowObject = {
      'Session ID': sessionId,
      'Member ID': memberId,
      'Student Email': email,
      'Response': response,
      'Reason': reason,
      'Submitted At': originalSubmittedAt,
      'Updated At': now
    };

    const newRowValues = headers.map((header, index) =>
      Object.prototype.hasOwnProperty.call(
        newRowObject,
        header
      )
        ? newRowObject[header]
        : matchingRowValues
          ? matchingRowValues[index]
          : ''
    );

    if (matchingRowNumber) {
      sheet
        .getRange(
          matchingRowNumber,
          1,
          1,
          headers.length
        )
        .setValues([newRowValues]);
    } else {
      sheet.appendRow(newRowValues);
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      sessionId: sessionId,
      response: response,
      reason: reason,
      messageKey: 'availability.saved',
      updatedAt: formatDateTime_(
        now,
        getTimeZone_()
      )
    };
  } finally {
    lock.releaseLock();
  }
}


/**
 * Finds an active upcoming session that can receive
 * an availability response.
 *
 * @param {string} sessionId
 * @return {Object|null}
 */
function getEditableSession_(sessionId) {
  const now = new Date();

  return getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  ).find(session => {
    const rowSessionId = String(
      session['Session ID'] || ''
    ).trim();

    const dateClassification = classifySessionDate_(session.Date);

    const sessionType = String(
      session['Session Type'] || ''
    ).trim();

    const responseDeadline = parseDateTime_(
      session['Response Deadline']
    );

    return (
      rowSessionId === sessionId &&
      (
        dateClassification === SESSION_DATE_CLASSIFICATIONS_.TODAY ||
        dateClassification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING
      ) &&
      isTrue_(session.Active) &&
      sessionType !==
        CONFIG.SESSION_TYPES.CANCELLED &&
      (!responseDeadline || now <= responseDeadline)
    );
  }) || null;
}


/**
 * Confirms that the Availability sheet contains all
 * required columns.
 *
 * @param {string[]} headers
 */
function validateAvailabilityHeaders_(headers) {
  const requiredHeaders = [
    'Session ID',
    'Member ID',
    'Student Email',
    'Response',
    'Reason',
    'Submitted At',
    'Updated At'
  ];

  const missingHeaders =
    requiredHeaders.filter(header =>
      !headers.includes(header)
    );

  if (missingHeaders.length > 0) {
    throw new Error(
      'The Availability sheet is missing these columns: ' +
      missingHeaders.join(', ')
    );
  }
}


/**
 * Converts a spreadsheet row into an object.
 *
 * @param {string[]} headers
 * @param {Array} row
 * @return {Object}
 */
function rowToObject_(headers, row) {
  const object = {};

  headers.forEach((header, index) => {
    object[header] = row[index];
  });

  return object;
}
