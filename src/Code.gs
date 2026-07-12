const CONFIG = Object.freeze({
  APP_TITLE: 'Club Portal',

  SHEETS: Object.freeze({
    MEMBERS: 'Members',
    SESSIONS: 'Sessions',
    AVAILABILITY: 'Availability',
    VOLUNTEERS: 'Volunteer Assignments',
    ATTENDANCE: 'Attendance',
    SETTINGS: 'Settings'
  }),

  ROLES: Object.freeze({
    STUDENT: 'Student',
    CLUB_LEADER: 'Club Leader',
    TEACHER: 'Teacher'
  }),

  SESSION_TYPES: Object.freeze({
    REGULAR: 'Regular',
    EVENT: 'Event',
    CANCELLED: 'Cancelled'
  }),

  AVAILABILITY: Object.freeze({
    AVAILABLE: 'Available',
    UNAVAILABLE: 'Unavailable',
    UNSURE: 'Unsure'
  }),

  DEFAULT_TIME_ZONE: 'Asia/Tokyo',
  UPCOMING_WEEKS: 8,
  NOTIFICATION_DAYS: 14
});

/**
 * Returns the contents of a trusted HTML partial for template inclusion.
 *
 * @param {string} filename Apps Script HTML filename without the extension.
 * @return {string} Partial contents.
 */
function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
