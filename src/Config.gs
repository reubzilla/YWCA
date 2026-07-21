/**
 * Returns the currently signed-in active club member.
 *
 * @return {Object}
 */
function getCurrentMember_() {
  const email = Session
    .getActiveUser()
    .getEmail()
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error(
      'Your Google account could not be identified. ' +
      'Please sign in using your school Google account.'
    );
  }

  const member = getMemberByEmail_(email);

  if (!member) {
    throw new Error(
      `Your account (${email}) is not registered as a club member.`
    );
  }

  if (!isTrue_(member.Active)) {
    throw new Error(
      'Your club membership is currently inactive.'
    );
  }

  return member;
}


/**
 * Finds a member by email address.
 *
 * @param {string} email
 * @return {Object|null}
 */
function getMemberByEmail_(email) {
  const members = getSheetObjects_(
    CONFIG.SHEETS.MEMBERS
  );

  return members.find(member => {
    const memberEmail = String(member.Email || '')
      .trim()
      .toLowerCase();

    return memberEmail === email;
  }) || null;
}


/**
 * Returns permissions based on the member's role.
 *
 * @param {Object} member
 * @return {Object}
 */
function getPermissions_(member) {
  const role = String(member.Role || '').trim();

  const isTeacher =
    role === CONFIG.ROLES.TEACHER;

  const isLeader =
    role === CONFIG.ROLES.CLUB_LEADER;

  return {
    canSubmitAvailability: true,
    canCheckIn: true,
    canViewOwnSchedule: true,

    canViewDashboard: isTeacher || isLeader,
    canViewAllAvailability: isTeacher || isLeader,
    canViewAttendanceSummary: isTeacher || isLeader,
    canRecordAttendance: isTeacher,
    canViewAttendanceHistory: isTeacher,
    canManageVolunteers: isTeacher || isLeader,

    canManageSessions: isTeacher,
    canManageMembers: isTeacher,
    canManageRoles: isTeacher,
    canManageSettings: isTeacher
  };
}
