/**
 * Returns the initial management dashboard data.
 *
 * Only Teachers and Club Leaders may call this function.
 *
 * @return {Object}
 */
function getDashboardData() {
  const member = requireDashboardAccess_();
  const todaySessions = getTodaySessions_();

  return {
    user: {
      name: String(member.Name || ''),
      role: String(member.Role || '')
    },

    todayDateValue: getTodayDateValue_(),

    sessions: todaySessions,

    selectedSession:
      todaySessions.length > 0
        ? sanitizeDashboardSessionData_(
            buildTodaySessionData_(todaySessions[0].sessionId),
            member
          )
        : null
  };
}


/**
 * Returns dashboard information for a selected session.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function getDashboardSession(sessionId) {
  const member = requireDashboardAccess_();

  if (!sessionId) {
    throw new Error(
      'No dashboard session was selected.'
    );
  }

  const todaySession = getTodaySessions_().find(session =>
    session.sessionId === String(sessionId).trim()
  );

  if (!todaySession) {
    throw new Error(
      'The selected session is not active today.'
    );
  }

  return sanitizeDashboardSessionData_(
    buildTodaySessionData_(todaySession.sessionId),
    member
  );
}


/**
 * Removes detailed attendance information from non-Teacher dashboard
 * payloads while preserving the authorised operational summary.
 *
 * @param {Object} data
 * @param {Object} viewer
 * @return {Object}
 */
function sanitizeDashboardSessionData_(data, viewer) {
  if (
    String(viewer.Role || '').trim() === CONFIG.ROLES.TEACHER
  ) {
    return data;
  }

  const sanitizeMember = member => ({
    ...member,
    attendance: null
  });
  const detailedAttendanceGroups = new Set([
    'attendanceRecorded',
    'attendanceMissing',
    'present',
    'late',
    'absent',
    'excused',
    'notRecorded'
  ]);
  const groups = Object.keys(data.groups || {}).reduce(
    (result, key) => {
      result[key] = detailedAttendanceGroups.has(key)
        ? []
        : (data.groups[key] || []).map(sanitizeMember);
      return result;
    },
    {}
  );

  return {
    ...data,
    groups: groups,
    members: (data.members || []).map(sanitizeMember)
  };
}


/**
 * Enforces server-side dashboard permissions.
 *
 * @return {Object}
 */
function requireDashboardAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canViewDashboard) {
    throw new Error(
      'You do not have permission to view the management dashboard.'
    );
  }

  return member;
}
