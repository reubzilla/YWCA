/**
 * Returns notifications for the signed-in member.
 *
 * @param {Object} member
 * @return {Object[]}
 */
function getNotifications_(member) {
  const sessionRows = getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  );

  const availabilityRows = getSheetObjects_(
    CONFIG.SHEETS.AVAILABILITY
  );

  const volunteerRows = getSheetObjects_(
    CONFIG.SHEETS.VOLUNTEERS
  );

  const memberId = String(
    member['Member ID'] || ''
  ).trim();

  const email = String(member.Email || '')
    .trim()
    .toLowerCase();

  const todayDateValue = getTodayDateValue_();
  const limitDateValue = addDaysToDateValue_(
    todayDateValue,
    CONFIG.NOTIFICATION_DAYS
  );

  const relevantSessions = sessionRows
    .filter(session => {
      const dateValue = getDateOnlyValue_(session.Date);
      const classification = classifySessionDate_(
        dateValue,
        todayDateValue
      );

      return dateValue &&
        classification !== SESSION_DATE_CLASSIFICATIONS_.PAST &&
        dateValue <= limitDateValue &&
        isTrue_(session.Active) &&
        String(session['Session Type'] || '') !==
          CONFIG.SESSION_TYPES.CANCELLED;
    })
    .sort(compareSessionsChronologically_);

  const notifications = [];

  relevantSessions.forEach(session => {
    const sessionId = String(
      session['Session ID'] || ''
    ).trim();

    const sessionDateValue = getDateOnlyValue_(session.Date);

    const response = findCurrentAvailabilityRow_(
      sessionId,
      memberId,
      email,
      availabilityRows
    );

    const volunteerAssignment = volunteerRows.find(row =>
      String(row['Session ID'] || '').trim() === sessionId &&
      memberMatches_(row, memberId, email) &&
      !isCancelledAssignment_(row)
    );

    if (!response) {
      notifications.push({
        type: 'response',
        priority: 'action',
        sessionTitle: String(session.Title || ''),
        sessionId: sessionId,
        dateValue: sessionDateValue,
        dateClassification: classifySessionDate_(
          sessionDateValue,
          todayDateValue
        )
      });
    }

    if (volunteerAssignment) {
      const activity = String(
        volunteerAssignment.Activity || ''
      );

      const location = String(
        volunteerAssignment.Location || ''
      );

      notifications.push({
        type: 'volunteer',
        priority: 'information',
        activity: activity,
        location: location,
        sessionId: sessionId,
        dateValue: sessionDateValue,
        dateClassification: classifySessionDate_(
          sessionDateValue,
          todayDateValue
        )
      });
    }
  });

  return notifications.slice(0, 6);
}


/**
 * Checks whether a row refers to a particular member.
 *
 * @param {Object} row
 * @param {string} memberId
 * @param {string} email
 * @return {boolean}
 */
function memberMatches_(row, memberId, email) {
  const rowMemberId = String(
    row['Member ID'] || ''
  ).trim();

  const rowEmail = String(
    row['Student Email'] ||
    row.Email ||
    ''
  )
    .trim()
    .toLowerCase();

  if (memberId && rowMemberId) {
    return rowMemberId === memberId;
  }

  return Boolean(email && rowEmail === email);
}
