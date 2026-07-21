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

  ASSIGNMENT_STATUSES: Object.freeze({
    ASSIGNED: 'Assigned',
    CONFIRMED: 'Confirmed',
    DECLINED: 'Declined',
    CANCELLED: 'Cancelled'
  }),

  ATTENDANCE_STATUSES: Object.freeze({
    PRESENT: 'Present',
    LATE: 'Late',
    ABSENT: 'Absent',
    EXCUSED: 'Excused'
  }),

  ATTENDANCE_METHODS: Object.freeze({
    TEACHER_MANUAL: 'Teacher Manual'
  }),

  DEFAULT_TIME_ZONE: 'Asia/Tokyo',
  UPCOMING_WEEKS: 8,
  NOTIFICATION_DAYS: 14,
  STUDENT_HISTORY_DAYS: 60,
  STUDENT_HISTORY_PAGE_SIZE: 20,
  MANAGEMENT_HISTORY_PAGE_SIZE: 50,
  ATTENDANCE_NOTE_MAX_LENGTH: 500
});

/**
 * Returns the contents of a trusted HTML partial for template inclusion.
 *
 * @param {string} filename Apps Script HTML filename without the extension.
 * @return {string} Partial contents.
 */
function include_(filename) {
  return HtmlService
    .createTemplateFromFile(filename)
    .getRawContent();
}
