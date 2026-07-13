/**
 * Returns the application business time zone.
 *
 * @return {string}
 */
function getTimeZone_() {
  return CONFIG.DEFAULT_TIME_ZONE;
}


/**
 * Converts checkbox and text values into Boolean values.
 *
 * @param {*} value
 * @return {boolean}
 */
function isTrue_(value) {
  const normalized = String(value)
    .trim()
    .toLowerCase();

  return value === true ||
    normalized === 'true' ||
    normalized === 'yes';
}


/**
 * Converts a spreadsheet value into a date at midnight.
 *
 * @param {*} value
 * @return {Date|null}
 */
function parseSheetDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return startOfDay_(value);
  }

  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (isNaN(parsed.getTime())) {
    return null;
  }

  return startOfDay_(parsed);
}


/**
 * Converts a spreadsheet value into a full date and time.
 *
 * @param {*} value
 * @return {Date|null}
 */
function parseDateTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value);
  }

  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  return isNaN(parsed.getTime()) ? null : parsed;
}


/**
 * Returns a date with the time set to midnight.
 *
 * @param {Date} date
 * @return {Date}
 */
function startOfDay_(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}


/**
 * Formats a spreadsheet time.
 *
 * @param {*} value
 * @param {string} timeZone
 * @return {string}
 */
function formatTime_(value, timeZone) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      timeZone,
      'HH:mm'
    );
  }

  return String(value);
}


/**
 * Formats a date-only value for a client payload.
 *
 * @param {*} value
 * @param {string} timeZone
 * @return {string}
 */
function formatDateOnly_(value, timeZone) {
  const date = parseSheetDate_(value);

  if (!date) {
    return value ? String(value) : '';
  }

  return Utilities.formatDate(
    date,
    timeZone,
    'yyyy-MM-dd'
  );
}


/**
 * Formats a date and time for a client payload.
 *
 * @param {*} value
 * @param {string} timeZone
 * @return {string}
 */
function formatDateTime_(value, timeZone) {
  if (!value) {
    return '';
  }

  const date = parseDateTime_(value);

  if (!date) {
    return String(value);
  }

  const valueWithOffset = Utilities.formatDate(
    date,
    timeZone,
    "yyyy-MM-dd'T'HH:mm:ssZ"
  );

  return valueWithOffset.replace(
    /([+-]\d{2})(\d{2})$/,
    '$1:$2'
  );
}
