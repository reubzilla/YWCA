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
        classification === SESSION_DATE_CLASSIFICATIONS_.UPCOMING &&
        dateValue <= finalDateValue;
    })
    .sort(compareSessionsChronologically_)
    .map(row => mapSessionForClient_(row, timeZone));
}


/**
 * Returns active, non-cancelled sessions for personal availability.
 * Current sessions retain the configured future window; history is
 * returned separately and is always read-only in the browser.
 *
 * @param {number} weeksAhead
 * @param {Object=} historyOptions
 * @return {Object}
 */
function getAvailabilitySessions_(weeksAhead, historyOptions) {
  const timeZone = getTimeZone_();
  const todayDateValue = getTodayDateValue_();
  const options = historyOptions && typeof historyOptions === 'object'
    ? historyOptions
    : {};
  const includeHistory = options.includeHistory !== false;
  const includeOlder = options.includeOlder === true;
  const historyOffset = normalizeHistoryOffset_(options.historyOffset);
  const recentHistoryStart = addDaysToDateValue_(
    todayDateValue,
    -CONFIG.STUDENT_HISTORY_DAYS
  );
  const finalDateValue = addDaysToDateValue_(
    todayDateValue,
    weeksAhead * 7
  );
  const mapped = getActiveSessionRows_()
    .map(row => mapSessionForClient_(row, timeZone));
  const allHistory = mapped
    .filter(session =>
      session.dateClassification ===
        SESSION_DATE_CLASSIFICATIONS_.PAST
    )
    .sort(compareSessionsReverseChronologically_);
  const historySource = !includeHistory
    ? []
    : includeOlder
      ? allHistory
      : allHistory.filter(session =>
          session.dateValue >= recentHistoryStart
        );
  const historyPage = buildHistoryPage_(
    historySource,
    historyOffset,
    CONFIG.STUDENT_HISTORY_PAGE_SIZE
  );
  const hasOlderOutsideRecentWindow = includeHistory && !includeOlder &&
    allHistory.some(session =>
      session.dateValue < recentHistoryStart
    );

  return {
    sessions: mapped
      .filter(session =>
        session.dateClassification !==
          SESSION_DATE_CLASSIFICATIONS_.PAST &&
        session.dateValue <= finalDateValue
      )
      .sort(compareSessionsChronologically_),
    history: historyPage.items,
    historyPage: {
      offset: historyPage.offset,
      nextOffset: historyPage.nextOffset,
      hasMore: historyPage.hasMore || hasOlderOutsideRecentWindow,
      total: includeHistory
        ? includeOlder ? historyPage.total : allHistory.length
        : 0,
      includesOlder: includeOlder,
      recentDays: CONFIG.STUDENT_HISTORY_DAYS
    }
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
