/**
 * Returns all active sessions taking place today.
 *
 * @return {Object[]}
 */
function getTodaySessions_() {
  const today = startOfDay_(new Date());
  const timeZone = getTimeZone_();

  return getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row => {
      const sessionDate = parseSheetDate_(row.Date);
      const sessionType = String(
        row['Session Type'] || ''
      ).trim();

      return (
        sessionDate &&
        sessionDate.getTime() === today.getTime() &&
        isTrue_(row.Active) &&
        sessionType !== CONFIG.SESSION_TYPES.CANCELLED
      );
    })
    .sort((a, b) => {
      return getTimeSortValue_(a['Start Time']) -
        getTimeSortValue_(b['Start Time']);
    })
    .map(row => mapSessionForClient_(row, timeZone));
}


/**
 * Builds the complete operational picture for one session.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function buildTodaySessionData_(sessionId) {
  const sessionRows = getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  );

  const sessionRow = sessionRows.find(row =>
    String(row['Session ID'] || '').trim() ===
      String(sessionId || '').trim()
  );

  if (!sessionRow) {
    throw new Error('The selected session could not be found.');
  }

  const timeZone = getTimeZone_();
  const session = mapSessionForClient_(
    sessionRow,
    timeZone
  );

  const members = getActiveAttendingMembers_();

  const availabilityRows = getSheetObjects_(
    CONFIG.SHEETS.AVAILABILITY
  );

  const volunteerRows = getSheetObjects_(
    CONFIG.SHEETS.VOLUNTEERS
  );

  const attendanceRows = getSheetObjects_(
    CONFIG.SHEETS.ATTENDANCE
  );

  const memberRecords = members.map(member => {
    const memberId = String(
      member['Member ID'] || ''
    ).trim();

    const email = String(member.Email || '')
      .trim()
      .toLowerCase();

    const availability = availabilityRows.find(row =>
      String(row['Session ID'] || '').trim() ===
        session.sessionId &&
      memberMatches_(row, memberId, email)
    );

    const volunteerAssignment = volunteerRows.find(row =>
      String(row['Session ID'] || '').trim() ===
        session.sessionId &&
      memberMatches_(row, memberId, email) &&
      !isCancelledAssignment_(row)
    );

    const attendance = attendanceRows.find(row =>
      String(row['Session ID'] || '').trim() ===
        session.sessionId &&
      memberMatches_(row, memberId, email)
    );

    return {
      memberId: memberId,
      name: String(member.Name || ''),
      email: email,
      grade: String(member.Grade || ''),
      role: String(member.Role || ''),

      availability: availability
        ? String(availability.Response || '')
        : '',

      reason: availability
        ? String(availability.Reason || '')
        : '',

      volunteer: volunteerAssignment
        ? {
            activity: String(
              volunteerAssignment.Activity || ''
            ),
            location: String(
              volunteerAssignment.Location || ''
            ),
            departureTime: formatTime_(
              volunteerAssignment['Departure Time'],
              timeZone
            ),
            status: String(
              volunteerAssignment[
                'Assignment Status'
              ] || ''
            ),
            notes: String(
              volunteerAssignment.Notes || ''
            )
          }
        : null,

      attendance: attendance
        ? {
            status: String(
              attendance['Attendance Status'] || ''
            ),
            checkInTime: formatDateTime_(
              attendance['Check-in Time'],
              timeZone
            ),
            method: String(
              attendance.Method || ''
            ),
            teacherNote: String(
              attendance['Teacher Note'] || ''
            )
          }
        : null
    };
  });

  return {
    session: session,
    summary: createTodaySummary_(memberRecords),
    groups: createTodayGroups_(memberRecords),
    members: memberRecords
  };
}


/**
 * Returns active students and Club Leaders who can be
 * expected to participate in club activities.
 *
 * Teachers are excluded from student attendance totals.
 *
 * @return {Object[]}
 */
function getActiveAttendingMembers_() {
  return getSheetObjects_(CONFIG.SHEETS.MEMBERS)
    .filter(member => {
      const role = String(member.Role || '').trim();

      return (
        isTrue_(member.Active) &&
        (
          role === CONFIG.ROLES.STUDENT ||
          role === CONFIG.ROLES.CLUB_LEADER
        )
      );
    })
    .sort((a, b) =>
      String(a.Name || '').localeCompare(
        String(b.Name || ''),
        'ja'
      )
    );
}


/**
 * Creates dashboard totals.
 *
 * @param {Object[]} members
 * @return {Object}
 */
function createTodaySummary_(members) {
  const available = members.filter(member =>
    member.availability ===
      CONFIG.AVAILABILITY.AVAILABLE
  );

  const unavailable = members.filter(member =>
    member.availability ===
      CONFIG.AVAILABILITY.UNAVAILABLE
  );

  const unsure = members.filter(member =>
    member.availability ===
      CONFIG.AVAILABILITY.UNSURE
  );

  const noResponse = members.filter(member =>
    !member.availability
  );

  const volunteers = members.filter(member =>
    Boolean(member.volunteer)
  );

  const expected = members.filter(member =>
    member.availability !==
      CONFIG.AVAILABILITY.UNAVAILABLE
  );

  const attendanceRecorded = expected.filter(member =>
    Boolean(member.attendance)
  );

  return {
    activeMembers: members.length,
    expected: expected.length,
    available: available.length,
    unavailable: unavailable.length,
    unsure: unsure.length,
    noResponse: noResponse.length,
    volunteers: volunteers.length,
    attendanceRecorded: attendanceRecorded.length,
    notYetRecorded: Math.max(
      expected.length - attendanceRecorded.length,
      0
    )
  };
}


/**
 * Organises members into the dashboard categories.
 *
 * @param {Object[]} members
 * @return {Object}
 */
function createTodayGroups_(members) {
  return {
    volunteers: members.filter(member =>
      Boolean(member.volunteer)
    ),

    available: members.filter(member =>
      member.availability ===
        CONFIG.AVAILABILITY.AVAILABLE &&
      !member.volunteer
    ),

    unavailable: members.filter(member =>
      member.availability ===
        CONFIG.AVAILABILITY.UNAVAILABLE
    ),

    unsure: members.filter(member =>
      member.availability ===
        CONFIG.AVAILABILITY.UNSURE
    ),

    noResponse: members.filter(member =>
      !member.availability
    ),

    attendanceRecorded: members.filter(member =>
      Boolean(member.attendance)
    ),

    attendanceMissing: members.filter(member =>
      member.availability !==
        CONFIG.AVAILABILITY.UNAVAILABLE &&
      !member.attendance
    ),

    conflicts: members.filter(member =>
      Boolean(member.volunteer) &&
      member.availability ===
        CONFIG.AVAILABILITY.UNAVAILABLE
    )
  };
}


/**
 * Returns true when a volunteer assignment should be ignored.
 *
 * @param {Object} row
 * @return {boolean}
 */
function isCancelledAssignment_(row) {
  const status = String(
    row['Assignment Status'] || ''
  )
    .trim()
    .toLowerCase();

  return (
    status === 'cancelled' ||
    status === 'declined'
  );
}


/**
 * Produces a sortable number for a spreadsheet time.
 *
 * @param {*} value
 * @return {number}
 */
function getTimeSortValue_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return (
      value.getHours() * 60 +
      value.getMinutes()
    );
  }

  const match = String(value || '').match(
    /^(\d{1,2}):(\d{2})/
  );

  if (!match) {
    return 9999;
  }

  return Number(match[1]) * 60 +
    Number(match[2]);
}
