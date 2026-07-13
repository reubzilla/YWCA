const FUTURE_AVAILABILITY_SESSION_TYPES_ = Object.freeze([
  CONFIG.SESSION_TYPES.REGULAR,
  CONFIG.SESSION_TYPES.EVENT
]);

/**
 * Returns summary counts for active future sessions.
 *
 * Only members with club-wide availability permission may call this
 * function.
 *
 * @param {Object} filters
 * @return {Object}
 */
function getUpcomingActivities(filters) {
  requireFutureAvailabilityAccess_();

  const validation = validateUpcomingActivityFilters_(filters);

  if (!validation.success) {
    return validation;
  }

  const sessionRows = getFutureAvailabilitySessionRows_(
    validation.value
  );
  const context = buildFutureAvailabilityContext_(
    sessionRows.map(row =>
      String(row['Session ID'] || '').trim()
    )
  );
  const sessions = sessionRows.map(row => {
    const data = buildFutureActivityData_(row, context);

    return {
      ...data.session,
      counts: {
        available: data.summary.available,
        unavailable: data.summary.unavailable,
        unsure: data.summary.unsure,
        noResponse: data.summary.noResponse,
        assignedVisitors: data.summary.assignedVisitors,
        conflicts: data.summary.conflicts
      }
    };
  });

  return {
    success: true,
    range: {
      fromDateValue: validation.value.fromDateValue,
      toDateValue: validation.value.toDateValue,
      weeksAhead: CONFIG.UPCOMING_WEEKS
    },
    sessionTypes: FUTURE_AVAILABILITY_SESSION_TYPES_,
    sessions: sessions
  };
}


/**
 * Returns grouped availability and assignment data for one future
 * session.
 *
 * Only members with club-wide availability permission may call this
 * function.
 *
 * @param {string} sessionId
 * @return {Object}
 */
function getUpcomingActivityDetail(sessionId) {
  requireFutureAvailabilityAccess_();

  const normalizedSessionId = String(sessionId || '').trim();

  if (!normalizedSessionId) {
    return futureAvailabilityFailure_('sessionIdRequired');
  }

  const matches = getSheetObjects_(
    CONFIG.SHEETS.SESSIONS
  ).filter(row =>
    String(row['Session ID'] || '').trim() ===
      normalizedSessionId
  );

  if (matches.length === 0) {
    return futureAvailabilityFailure_('sessionNotFound');
  }

  if (matches.length > 1) {
    return futureAvailabilityFailure_('duplicateSessionId');
  }

  if (!isFutureAvailabilitySession_(matches[0])) {
    return futureAvailabilityFailure_('sessionNotAvailable');
  }

  const context = buildFutureAvailabilityContext_([
    normalizedSessionId
  ]);
  const data = buildFutureActivityData_(matches[0], context);

  return {
    success: true,
    session: data.session,
    summary: data.summary,
    groups: data.groups
  };
}


/**
 * Requires permission to view club-wide availability information.
 *
 * @return {Object}
 */
function requireFutureAvailabilityAccess_() {
  const member = getCurrentMember_();
  const permissions = getPermissions_(member);

  if (!permissions.canViewAllAvailability) {
    throw new Error(
      'You do not have permission to view club-wide availability.'
    );
  }

  return member;
}


/**
 * Validates and normalizes list filters.
 *
 * @param {Object} filters
 * @return {Object}
 */
function validateUpcomingActivityFilters_(filters) {
  const input = filters && typeof filters === 'object'
    ? filters
    : {};
  const defaultRange = getDefaultUpcomingActivityRange_();
  const fromDateValue = String(
    input.fromDateValue || defaultRange.fromDateValue
  ).trim();
  const toDateValue = String(
    input.toDateValue || defaultRange.toDateValue
  ).trim();
  const sessionType = String(
    input.sessionType || ''
  ).trim();
  const fromDate = parseDateOnlyInput_(fromDateValue);
  const toDate = parseDateOnlyInput_(toDateValue);

  if (!fromDate) {
    return futureAvailabilityFailure_('fromDateInvalid');
  }

  if (!toDate) {
    return futureAvailabilityFailure_('toDateInvalid');
  }

  if (fromDate > toDate) {
    return futureAvailabilityFailure_('dateRangeInvalid');
  }

  const tomorrow = getFutureAvailabilityStartDate_();

  if (fromDate < tomorrow || toDate < tomorrow) {
    return futureAvailabilityFailure_('dateBeforeTomorrow');
  }

  if (
    sessionType &&
    !FUTURE_AVAILABILITY_SESSION_TYPES_.includes(sessionType)
  ) {
    return futureAvailabilityFailure_('sessionTypeInvalid');
  }

  return {
    success: true,
    value: {
      fromDateValue: fromDateValue,
      toDateValue: toDateValue,
      fromDate: fromDate,
      toDate: toDate,
      sessionType: sessionType
    }
  };
}


/**
 * Returns the default future date range.
 *
 * @return {Object}
 */
function getDefaultUpcomingActivityRange_() {
  const fromDate = getFutureAvailabilityStartDate_();
  const toDate = startOfDay_(new Date());

  toDate.setDate(
    toDate.getDate() + CONFIG.UPCOMING_WEEKS * 7
  );

  return {
    fromDateValue: formatDateOnly_(
      fromDate,
      getTimeZone_()
    ),
    toDateValue: formatDateOnly_(
      toDate,
      getTimeZone_()
    )
  };
}


/**
 * Returns tomorrow at the application date boundary.
 *
 * @return {Date}
 */
function getFutureAvailabilityStartDate_() {
  const tomorrow = startOfDay_(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
}


/**
 * Returns active future session rows matching validated filters.
 *
 * @param {Object} filters
 * @return {Object[]}
 */
function getFutureAvailabilitySessionRows_(filters) {
  return getSheetObjects_(CONFIG.SHEETS.SESSIONS)
    .filter(row => {
      if (!isFutureAvailabilitySession_(row)) {
        return false;
      }

      const sessionDate = parseSheetDate_(row.Date);
      const sessionType = String(
        row['Session Type'] || ''
      ).trim();

      return (
        sessionDate >= filters.fromDate &&
        sessionDate <= filters.toDate &&
        (
          !filters.sessionType ||
          sessionType === filters.sessionType
        )
      );
    })
    .sort((a, b) =>
      parseSheetDate_(a.Date) - parseSheetDate_(b.Date) ||
      getTimeSortValue_(a['Start Time']) -
        getTimeSortValue_(b['Start Time']) ||
      String(a['Session ID'] || '').localeCompare(
        String(b['Session ID'] || '')
      )
    );
}


/**
 * Returns whether a row belongs in Future Availability.
 *
 * @param {Object} row
 * @return {boolean}
 */
function isFutureAvailabilitySession_(row) {
  const sessionDate = parseSheetDate_(row.Date);
  const sessionType = String(
    row['Session Type'] || ''
  ).trim();

  return Boolean(
    sessionDate &&
    sessionDate >= getFutureAvailabilityStartDate_() &&
    isTrue_(row.Active) &&
    FUTURE_AVAILABILITY_SESSION_TYPES_.includes(sessionType)
  );
}


/**
 * Loads and indexes data shared across session aggregation.
 *
 * @param {string[]} sessionIds
 * @return {Object}
 */
function buildFutureAvailabilityContext_(sessionIds) {
  const sessionIdSet = new Set(sessionIds);
  const availabilityRows = getSheetObjects_(
    CONFIG.SHEETS.AVAILABILITY
  ).filter(row =>
    sessionIdSet.has(
      String(row['Session ID'] || '').trim()
    )
  );
  const volunteerRows = getSheetObjects_(
    CONFIG.SHEETS.VOLUNTEERS
  ).filter(row =>
    sessionIdSet.has(
      String(row['Session ID'] || '').trim()
    ) &&
    !isCancelledAssignment_(row)
  );

  return {
    members: getActiveAttendingMembers_(),
    availabilityBySession: indexFutureRowsBySession_(
      availabilityRows
    ),
    volunteersBySession: indexFutureRowsBySession_(
      volunteerRows
    )
  };
}


/**
 * Groups sheet rows by Session ID.
 *
 * @param {Object[]} rows
 * @return {Object}
 */
function indexFutureRowsBySession_(rows) {
  const index = Object.create(null);

  rows.forEach(row => {
    const sessionId = String(
      row['Session ID'] || ''
    ).trim();

    if (!sessionId) {
      return;
    }

    if (!index[sessionId]) {
      index[sessionId] = [];
    }

    index[sessionId].push(row);
  });

  return index;
}


/**
 * Builds summary and detail data for one session.
 *
 * Private availability notes are included only because callers have
 * already passed requireFutureAvailabilityAccess_().
 *
 * @param {Object} sessionRow
 * @param {Object} context
 * @return {Object}
 */
function buildFutureActivityData_(sessionRow, context) {
  const session = mapFutureAvailabilitySession_(sessionRow);
  const availabilityRows =
    context.availabilityBySession[session.sessionId] || [];
  const volunteerRows =
    context.volunteersBySession[session.sessionId] || [];
  const members = context.members.map(member =>
    createFutureAvailabilityMemberRecord_(
      member,
      availabilityRows,
      volunteerRows
    )
  );

  return {
    session: session,
    summary: createFutureAvailabilitySummary_(members),
    groups: mapFutureAvailabilityGroupsForClient_(
      createFutureAvailabilityGroups_(members)
    )
  };
}


/**
 * Maps only the session fields required by Future Availability.
 *
 * @param {Object} row
 * @return {Object}
 */
function mapFutureAvailabilitySession_(row) {
  const session = mapSessionForClient_(
    row,
    getTimeZone_()
  );

  return {
    sessionId: session.sessionId,
    dateValue: session.dateValue,
    title: session.title,
    sessionType: session.sessionType,
    startTime: session.startTime,
    endTime: session.endTime
  };
}


/**
 * Creates one management-safe member record.
 *
 * Email addresses are used only for server-side matching and are never
 * returned to the browser.
 *
 * @param {Object} member
 * @param {Object[]} availabilityRows
 * @param {Object[]} volunteerRows
 * @return {Object}
 */
function createFutureAvailabilityMemberRecord_(
  member,
  availabilityRows,
  volunteerRows
) {
  const memberId = String(
    member['Member ID'] || ''
  ).trim();
  const email = String(member.Email || '')
    .trim()
    .toLowerCase();
  const availability = availabilityRows.find(row =>
    memberMatches_(row, memberId, email)
  );
  const volunteerAssignment = volunteerRows.find(row =>
    memberMatches_(row, memberId, email)
  );

  return {
    memberId: memberId,
    name: String(member.Name || ''),
    grade: String(member.Grade || ''),
    role: String(member.Role || '').trim(),
    hasAvailability: Boolean(availability),
    response: availability
      ? String(availability.Response || '').trim()
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
            getTimeZone_()
          ),
          status: String(
            volunteerAssignment['Assignment Status'] || ''
          ).trim(),
          notes: String(volunteerAssignment.Notes || '')
        }
      : null
  };
}


/**
 * Creates future availability totals.
 *
 * @param {Object[]} members
 * @return {Object}
 */
function createFutureAvailabilitySummary_(members) {
  const groups = createFutureAvailabilityGroups_(members);

  return {
    activeMembers: members.length,
    available: groups.available.length,
    unavailable: groups.unavailable.length,
    unsure: groups.unsure.length,
    noResponse: groups.noResponse.length,
    assignedVisitors: groups.visitors.length,
    conflicts: groups.conflicts.length
  };
}


/**
 * Organises members into availability and assignment groups.
 *
 * No response is derived only when no matching Availability row exists.
 * Visitor and conflict groups intentionally overlap response groups.
 *
 * @param {Object[]} members
 * @return {Object}
 */
function createFutureAvailabilityGroups_(members) {
  return {
    available: members.filter(member =>
      member.response === CONFIG.AVAILABILITY.AVAILABLE
    ),
    unavailable: members.filter(member =>
      member.response === CONFIG.AVAILABILITY.UNAVAILABLE
    ),
    unsure: members.filter(member =>
      member.response === CONFIG.AVAILABILITY.UNSURE
    ),
    noResponse: members.filter(member =>
      !member.hasAvailability
    ),
    visitors: members.filter(member =>
      Boolean(member.volunteer)
    ),
    conflicts: members.filter(member =>
      Boolean(member.volunteer) &&
      member.response === CONFIG.AVAILABILITY.UNAVAILABLE
    )
  };
}


/**
 * Removes server-only matching state from member records.
 *
 * @param {Object} groups
 * @return {Object}
 */
function mapFutureAvailabilityGroupsForClient_(groups) {
  return Object.fromEntries(
    Object.entries(groups).map(([groupName, members]) => [
      groupName,
      members.map(member => {
        const clientMember = { ...member };
        delete clientMember.hasAvailability;
        return clientMember;
      })
    ])
  );
}


/**
 * Returns a stable validation or lookup failure.
 *
 * @param {string} errorCode
 * @return {Object}
 */
function futureAvailabilityFailure_(errorCode) {
  return {
    success: false,
    errorCode: errorCode
  };
}
