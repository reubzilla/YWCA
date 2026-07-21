/**
 * Returns the stored availability values recognised by the application.
 *
 * @return {string[]}
 */
function getAvailabilityResponseValues_() {
  return [
    CONFIG.AVAILABILITY.AVAILABLE,
    CONFIG.AVAILABILITY.UNAVAILABLE,
    CONFIG.AVAILABILITY.UNSURE
  ];
}


/**
 * Returns a recognised response or an empty value for legacy/invalid data.
 *
 * @param {*} value
 * @return {string}
 */
function normalizeAvailabilityResponse_(value) {
  const response = String(value || '').trim();

  return getAvailabilityResponseValues_().includes(response)
    ? response
    : '';
}


/**
 * Finds the current valid response for one member and session.
 *
 * Duplicate legacy rows are resolved deterministically by preferring the
 * most recently updated valid response, then the most recently submitted
 * response. A row without a recognised response is not a current response.
 *
 * @param {string} sessionId
 * @param {string} memberId
 * @param {string} email
 * @param {Object[]} rows
 * @return {Object|null}
 */
function findCurrentAvailabilityRow_(
  sessionId,
  memberId,
  email,
  rows
) {
  const normalizedSessionId = String(sessionId || '').trim();
  const matches = (rows || []).filter(row =>
    String(row['Session ID'] || '').trim() ===
      normalizedSessionId &&
    memberMatches_(row, memberId, email) &&
    Boolean(normalizeAvailabilityResponse_(row.Response))
  );

  return matches.reduce((current, row) => {
    if (!current) return row;

    return getAvailabilityRowSortTime_(row) >=
      getAvailabilityRowSortTime_(current)
      ? row
      : current;
  }, null);
}


/**
 * Returns the best machine timestamp available for duplicate resolution.
 *
 * @param {Object} row
 * @return {number}
 */
function getAvailabilityRowSortTime_(row) {
  const timestamp = parseAvailabilityDateTime_(row['Updated At']) ||
    parseAvailabilityDateTime_(row['Submitted At']);

  return timestamp ? timestamp.getTime() : 0;
}


/**
 * Parses sheet timestamps, treating an offset-free value as Tokyo time.
 * Spreadsheet Date objects and offset-bearing machine values retain their
 * absolute instant.
 *
 * @param {*} value
 * @return {Date|null}
 */
function parseAvailabilityDateTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value);
  }

  const text = String(value || '').trim();
  const withoutOffset = text.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/
  );

  if (withoutOffset) {
    const parsedTokyo = new Date(
      `${withoutOffset[1]}T${withoutOffset[2]}+09:00`
    );

    return isNaN(parsedTokyo.getTime()) ? null : parsedTokyo;
  }

  return parseDateTime_(value);
}


/**
 * Builds the current response and independent deadline timing metadata.
 *
 * For legacy rows without Submitted At, Updated At is the documented
 * fallback approximation of the original submission time.
 *
 * @param {Object|null} row
 * @param {*} responseDeadline
 * @return {Object}
 */
function buildAvailabilityRecord_(row, responseDeadline) {
  const timeZone = getTimeZone_();
  const deadline = parseAvailabilityDateTime_(responseDeadline);
  const storedSubmittedAt = row
    ? parseAvailabilityDateTime_(row['Submitted At'])
    : null;
  const updatedAt = row
    ? parseAvailabilityDateTime_(row['Updated At'])
    : null;
  const submittedAt = storedSubmittedAt || updatedAt;

  return {
    response: row
      ? normalizeAvailabilityResponse_(row.Response)
      : '',
    reason: row ? String(row.Reason || '') : '',
    submittedAt: formatDateTime_(submittedAt, timeZone),
    updatedAt: formatDateTime_(updatedAt, timeZone),
    responseDeadline: formatDateTime_(deadline, timeZone),
    isLateResponse: Boolean(
      submittedAt && deadline &&
      submittedAt.getTime() > deadline.getTime()
    ),
    wasUpdatedAfterDeadline: Boolean(
      updatedAt && deadline &&
      updatedAt.getTime() > deadline.getTime()
    )
  };
}
