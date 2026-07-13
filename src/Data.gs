/**
 * Returns upcoming active sessions.
 *
 * @param {number} weeksAhead
 * @return {Object[]}
 */
function getUpcomingSessions_(weeksAhead) {
  const timeZone = getTimeZone_();
  const today = startOfDay_(new Date());

  const finalDate = new Date(today);
  finalDate.setDate(
    finalDate.getDate() + weeksAhead * 7
  );

  return getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row => {
      const sessionDate = parseSheetDate_(row.Date);
      const sessionType = String(
        row['Session Type'] || ''
      ).trim();

      return sessionDate &&
        sessionDate >= today &&
        sessionDate <= finalDate &&
        isTrue_(row.Active) &&
        sessionType !== CONFIG.SESSION_TYPES.CANCELLED;
    })
    .sort((a, b) =>
      parseSheetDate_(a.Date) -
      parseSheetDate_(b.Date)
    )
    .map(row => mapSessionForClient_(row, timeZone));
}


/**
 * Converts a session row into data safe for the HTML page.
 *
 * @param {Object} row
 * @param {string} timeZone
 * @return {Object}
 */
function mapSessionForClient_(row, timeZone) {
  const sessionDate = parseSheetDate_(row.Date);

  return {
    sessionId: String(row['Session ID'] || ''),
    dateValue: formatDateOnly_(
      sessionDate,
      timeZone
    ),
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
