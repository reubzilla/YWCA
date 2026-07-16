/**
 * Returns the application business time zone.
 *
 * @return {string}
 */
function getTimeZone_() {
  return CONFIG.DEFAULT_TIME_ZONE;
}


const SESSION_DATE_CLASSIFICATIONS_ = Object.freeze({
  TODAY: 'Today',
  UPCOMING: 'Upcoming',
  PAST: 'Past'
});


/**
 * Returns a validated calendar-date value in the application time zone.
 * Date-only strings are parsed explicitly and never through UTC defaults.
 *
 * @param {*} value
 * @return {string}
 */
function getDateOnlyValue_(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(
      value,
      getTimeZone_(),
      'yyyy-MM-dd'
    );
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parsedDateOnly = new Date(`${text}T00:00:00+09:00`);

    return !isNaN(parsedDateOnly.getTime()) &&
      Utilities.formatDate(
        parsedDateOnly,
        getTimeZone_(),
        'yyyy-MM-dd'
      ) === text
      ? text
      : '';
  }

  const parsed = new Date(text);

  return isNaN(parsed.getTime())
    ? ''
    : Utilities.formatDate(
        parsed,
        getTimeZone_(),
        'yyyy-MM-dd'
      );
}


/**
 * Returns today's calendar date in Asia/Tokyo.
 *
 * @return {string}
 */
function getTodayDateValue_() {
  return getDateOnlyValue_(new Date());
}


/**
 * Classifies a session date against the Tokyo calendar date.
 *
 * @param {*} value
 * @param {string=} todayDateValue
 * @return {string}
 */
function classifySessionDate_(value, todayDateValue) {
  const dateValue = getDateOnlyValue_(value);
  const todayValue = getDateOnlyValue_(
    todayDateValue || getTodayDateValue_()
  );

  if (!dateValue || !todayValue) {
    return '';
  }

  if (dateValue === todayValue) {
    return SESSION_DATE_CLASSIFICATIONS_.TODAY;
  }

  return dateValue > todayValue
    ? SESSION_DATE_CLASSIFICATIONS_.UPCOMING
    : SESSION_DATE_CLASSIFICATIONS_.PAST;
}


/**
 * Adds whole calendar days to a YYYY-MM-DD Tokyo date.
 * Asia/Tokyo has no daylight-saving transition.
 *
 * @param {string} dateValue
 * @param {number} days
 * @return {string}
 */
function addDaysToDateValue_(dateValue, days) {
  const parsed = parseDateOnlyInput_(dateValue);

  if (!parsed || !Number.isFinite(Number(days))) {
    return '';
  }

  return getDateOnlyValue_(new Date(
    parsed.getTime() + Number(days) * 24 * 60 * 60 * 1000
  ));
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
  const dateValue = getDateOnlyValue_(value);

  return dateValue
    ? new Date(`${dateValue}T00:00:00+09:00`)
    : null;
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
 * Parses a YYYY-MM-DD form value as a Tokyo calendar date.
 *
 * @param {*} value
 * @return {Date|null}
 */
function parseDateOnlyInput_(value) {
  const text = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const parsed = new Date(`${text}T00:00:00+09:00`);

  if (
    isNaN(parsed.getTime()) ||
    Utilities.formatDate(
      parsed,
      getTimeZone_(),
      'yyyy-MM-dd'
    ) !== text
  ) {
    return null;
  }

  return parsed;
}


/**
 * Parses a YYYY-MM-DDTHH:mm form value as Tokyo time.
 *
 * @param {*} value
 * @return {Date|null}
 */
function parseTokyoDateTimeInput_(value) {
  const text = String(value || '').trim();

  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)
  ) {
    return null;
  }

  const parsed = new Date(`${text}:00+09:00`);

  if (
    isNaN(parsed.getTime()) ||
    Utilities.formatDate(
      parsed,
      getTimeZone_(),
      "yyyy-MM-dd'T'HH:mm"
    ) !== text
  ) {
    return null;
  }

  return parsed;
}


/**
 * Returns a date with the time set to midnight.
 *
 * @param {Date} date
 * @return {Date}
 */
function startOfDay_(date) {
  return parseSheetDate_(date);
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
  return getDateOnlyValue_(value) ||
    (value ? String(value) : '');
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
