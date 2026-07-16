/**
 * Returns upcoming active sessions.
 *
 * @param {number} weeksAhead
 * @return {Object[]}
 */
function getUpcomingSessions_(weeksAhead) {
  const timeZone = getTimeZone_();
  const todayDateValue = getTodayDateValue_();
  const finalDateValue = addDaysToDateValue_(
    todayDateValue,
    weeksAhead * 7
  );

  return getActiveSessionRows_()
    .filter(row => {
      const dateValue = getDateOnlyValue_(row.Date);
      const classification = classifySessionDate_(
        dateValue,
        todayDateValue
      );

      return dateValue &&
        classification !== SESSION_DATE_CLASSIFICATIONS_.PAST &&
        dateValue <= finalDateValue;
    })
    .sort((a, b) =>
      getDateOnlyValue_(a.Date).localeCompare(
        getDateOnlyValue_(b.Date)
      )
    )
    .map(row => mapSessionForClient_(row, timeZone));
}


/**
 * Returns active, non-cancelled sessions for personal availability.
 * Current sessions retain the configured future window; history is
 * returned separately and is always read-only in the browser.
 *
 * @param {number} weeksAhead
 * @return {Object}
 */
function getAvailabilitySessions_(weeksAhead) {
  const timeZone = getTimeZone_();
  const todayDateValue = getTodayDateValue_();
  const finalDateValue = addDaysToDateValue_(
    todayDateValue,
    weeksAhead * 7
  );
  const mapped = getActiveSessionRows_()
    .map(row => mapSessionForClient_(row, timeZone));

  return {
    sessions: mapped
      .filter(session =>
        session.dateClassification !==
          SESSION_DATE_CLASSIFICATIONS_.PAST &&
        session.dateValue <= finalDateValue
      )
      .sort((a, b) =>
        a.dateValue.localeCompare(b.dateValue)
      ),
    history: mapped
      .filter(session =>
        session.dateClassification ===
          SESSION_DATE_CLASSIFICATIONS_.PAST
      )
      .sort((a, b) =>
        b.dateValue.localeCompare(a.dateValue)
      )
  };
}


/**
 * Returns valid active session rows, excluding cancelled sessions.
 *
 * @return {Object[]}
 */
function getActiveSessionRows_() {
  return getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row => {
      const sessionType = String(
        row['Session Type'] || ''
      ).trim();

      return Boolean(
        getDateOnlyValue_(row.Date) &&
        isTrue_(row.Active) &&
        sessionType !== CONFIG.SESSION_TYPES.CANCELLED
      );
    });
}


/**
 * Converts a session row into data safe for the HTML page.
 *
 * @param {Object} row
 * @param {string} timeZone
 * @return {Object}
 */
function mapSessionForClient_(row, timeZone) {
  const dateValue = getDateOnlyValue_(row.Date);

  return {
    sessionId: String(row['Session ID'] || ''),
    dateValue: dateValue,
    dateClassification: classifySessionDate_(dateValue),
    title: String(row.Title || ''),
    sessionType: String(row['Session Type'] || ''),
    startTime: formatTime_(
      row['Start Time'],
      timeZone
    ),
    endTime: formatTime_(
      row['End Time'],
      timeZone
    ),
    responseDeadline: formatDateTime_(
      row['Response Deadline'],
      timeZone
    ),
    notes: String(row.Notes || '')
  };
}
