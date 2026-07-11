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

    todayLabel: Utilities.formatDate(
      new Date(),
      getTimeZone_(),
      'EEEE, d MMMM yyyy'
    ),

    sessions: todaySessions,

    selectedSession:
      todaySessions.length > 0
        ? buildTodaySessionData_(
            todaySessions[0].sessionId
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
  requireDashboardAccess_();

  if (!sessionId) {
    throw new Error(
      'No dashboard session was selected.'
    );
  }

  return buildTodaySessionData_(sessionId);
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
