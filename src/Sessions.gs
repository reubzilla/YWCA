/**
 * Returns all active sessions taking place today.
 *
 * @return {Object[]}
 */
function getTodaySessions_() {
  const timeZone = getTimeZone_();

  return getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row => {
      const sessionType = String(
        row['Session Type'] || ''
      ).trim();

      return (
        classifySessionDate_(row.Date) ===
          SESSION_DATE_CLASSIFICATIONS_.TODAY &&
        isTrue_(row.Active) &&
        sessionType !== CONFIG.SESSION_TYPES.CANCELLED
      );
    })
    .sort(compareSessionsChronologically_)
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

    const availability = findCurrentAvailabilityRow_(
      session.sessionId,
      memberId,
      email,
      availabilityRows
    );
    const availabilityRecord = buildAvailabilityRecord_(
      availability,
      sessionRow['Response Deadline']
    );

    const volunteerAssignment = volunteerRows.find(row =>
      String(row['Session ID'] || '').trim() ===
        session.sessionId &&
      memberMatches_(row, memberId, email) &&
      !isCancelledAssignment_(row)
    );

    const attendance = findAttendanceRowForMember_(
      attendanceRows,
      session.sessionId,
      memberId,
      email
    );

    return {
      memberId: memberId,
      name: String(member.Name || ''),
      grade: String(member.Grade || ''),
      role: String(member.Role || ''),

      availability: availabilityRecord.response,
      reason: availabilityRecord.reason,
      submittedAt: availabilityRecord.submittedAt,
      updatedAt: availabilityRecord.updatedAt,
      responseDeadline: availabilityRecord.responseDeadline,
      isLateResponse: availabilityRecord.isLateResponse,
      wasUpdatedAfterDeadline:
        availabilityRecord.wasUpdatedAfterDeadline,

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
            checkInTime: formatAttendanceCheckInForClient_(
              attendance['Check-in Time'],
              session.dateValue,
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

  const attendanceCounts = Object.values(
    CONFIG.ATTENDANCE_STATUSES
  ).reduce((counts, status) => {
    counts[status] = members.filter(member =>
      member.attendance && member.attendance.status === status
    ).length;
    return counts;
  }, {});
  const attendanceRecorded = members.filter(member =>
    Boolean(member.attendance)
  );
  const notRecorded = members.length - attendanceRecorded.length;
  const expectedNotRecorded = expected.filter(member =>
    !member.attendance
  ).length;

  return {
    activeMembers: members.length,
    expected: expected.length,
    available: available.length,
    unavailable: unavailable.length,
    unsure: unsure.length,
    noResponse: noResponse.length,
    volunteers: volunteers.length,
    attendanceRecorded: attendanceRecorded.length,
    present: attendanceCounts[CONFIG.ATTENDANCE_STATUSES.PRESENT],
    late: attendanceCounts[CONFIG.ATTENDANCE_STATUSES.LATE],
    absent: attendanceCounts[CONFIG.ATTENDANCE_STATUSES.ABSENT],
    excused: attendanceCounts[CONFIG.ATTENDANCE_STATUSES.EXCUSED],
    notRecorded: notRecorded,
    notYetRecorded: expectedNotRecorded
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

    present: members.filter(member =>
      member.attendance &&
      member.attendance.status === CONFIG.ATTENDANCE_STATUSES.PRESENT
    ),

    late: members.filter(member =>
      member.attendance &&
      member.attendance.status === CONFIG.ATTENDANCE_STATUSES.LATE
    ),

    absent: members.filter(member =>
      member.attendance &&
      member.attendance.status === CONFIG.ATTENDANCE_STATUSES.ABSENT
    ),

    excused: members.filter(member =>
      member.attendance &&
      member.attendance.status === CONFIG.ATTENDANCE_STATUSES.EXCUSED
    ),

    notRecorded: members.filter(member => !member.attendance),

    conflicts: members.filter(member =>
      Boolean(member.volunteer) &&
      member.availability ===
        CONFIG.AVAILABILITY.UNAVAILABLE
    )
  };
}


/**
 * Returns the single attendance row for a session and member.
 * Member ID is authoritative. Email is used only for legacy rows that
 * do not yet contain a Member ID.
 *
 * @param {Object[]} rows
 * @param {string} sessionId
 * @param {string} memberId
 * @param {string} email
 * @return {Object|null}
 */
function findAttendanceRowForMember_(
  rows,
  sessionId,
  memberId,
  email
) {
  const normalizedSessionId = String(sessionId || '').trim();
  const normalizedMemberId = String(memberId || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const matches = (rows || []).filter(row => {
    if (
      String(row['Session ID'] || '').trim() !== normalizedSessionId
    ) {
      return false;
    }

    const rowMemberId = String(row['Member ID'] || '').trim();
    const rowEmail = String(row['Student Email'] || '')
      .trim()
      .toLowerCase();

    return rowMemberId
      ? Boolean(normalizedMemberId && rowMemberId === normalizedMemberId)
      : Boolean(normalizedEmail && rowEmail === normalizedEmail);
  });

  if (matches.length > 1) {
    throw new Error(
      'Duplicate attendance rows exist for this member and session.'
    );
  }

  if (!matches.length) {
    return null;
  }

  const status = String(
    matches[0]['Attendance Status'] || ''
  ).trim();

  if (!isApprovedAttendanceStatus_(status)) {
    throw new Error(
      'An attendance row contains an unsupported status.'
    );
  }

  return matches[0];
}


function isApprovedAttendanceStatus_(status) {
  return Object.values(CONFIG.ATTENDANCE_STATUSES).includes(
    String(status || '').trim()
  );
}


/**
 * Normalizes legacy HH:mm attendance values to a Tokyo date-time while
 * preserving normal spreadsheet Date values.
 *
 * @param {*} value
 * @param {string} sessionDateValue
 * @param {string} timeZone
 * @return {string}
 */
function formatAttendanceCheckInForClient_(
  value,
  sessionDateValue,
  timeZone
) {
  const text = String(value || '').trim();
  const dateValue = value instanceof Date && !isNaN(value.getTime())
    ? getDateOnlyValue_(value)
    : '';
  const legacyTime = dateValue && dateValue < '2000-01-01'
    ? formatTime_(value, timeZone)
    : /^\d{2}:\d{2}$/.test(text)
      ? text
      : '';

  if (legacyTime && sessionDateValue) {
    const parsed = new Date(
      `${sessionDateValue}T${legacyTime}:00+09:00`
    );

    if (!isNaN(parsed.getTime())) {
      return formatDateTime_(parsed, timeZone);
    }
  }

  return formatDateTime_(value, timeZone);
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
