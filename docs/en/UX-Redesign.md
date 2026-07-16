# UI Redesign Baseline

This document records the frontend routes and the manual acceptance baseline before the approved UI redesign begins. It describes the current application, not the intended redesigned navigation.

The English document is canonical. The Japanese document mirrors its structure.

## Phase 4 current experience

The route tables below preserve the Phase 0 baseline for regression history. The current Phase 4 route map supersedes those navigation descriptions:

| Route ID | Student | Club Leader | Teacher | Current purpose |
|---|---:|---:|---:|---|
| `today` | Yes | Yes | Yes | Action-first personal Today for Students; club-wide operational Today for Club Leaders and Teachers |
| `availability` | Yes | Yes | Yes | Personal My Availability list and focused response editor |
| `assignments` | Yes | Yes | Yes | Signed-in member's next, future, and historical assignments |
| `notifications` | Yes | Yes | Yes | Read-only personal notifications with actions into personal routes |
| `visitor-coordination` | No | Yes | Yes | Club Leader and Teacher visitor assignment management |
| `planning` | No | Yes | Yes | Club-wide Upcoming Activities planning |
| `sessions` | No | No | Yes | Teacher-only Sessions & Events management |
| `members` | No | No | Yes | Teacher-only Members management |

Student mobile navigation is Today, Availability, Assignments, and Notifications. Club Leader mobile navigation is Today, Visitors, Planning, Personal, and More. Personal assignment and availability routes remain separate from visitor coordination and club-wide planning.

Phase 4 adds these acceptance requirements:

- Student Today places urgent actions before today's activity and personal assignment.
- Availability renders one compact list and one focused editor rather than every full response form.
- No response sorts before Unsure, followed by answered sessions; dates remain chronological inside each group.
- My Assignments separates the next assignment, future assignments, and history.
- Notifications route response notices to Availability and assignment notices to My Assignments.
- Club Leader operational and personal navigation remain visibly separate.
- Student-facing APIs return only the authenticated member's availability, private note, and assignments.

## Current frontend routes

Frontend route visibility is not an authorization boundary. Server-side Apps Script functions must continue to authenticate the signed-in member and enforce permissions independently.

| Route ID | Current navigation label | Student | Club Leader | Teacher | Status | Current behaviour |
|---|---|---:|---:|---:|---|---|
| `home` | Home | Yes | Yes | Yes | Functional | Shows the signed-in member, personal notifications, and upcoming sessions from `getPortalData()`. |
| `availability` | Availability | Yes | Yes | Yes | Functional | Shows the signed-in member's upcoming sessions and availability. Saves through `saveAvailability()`. |
| `volunteer` | Volunteer Schedule / Visitor Schedules | Yes | Yes | Yes | Functional, role-dependent | Students see only their own assignments through `getMyVolunteerAssignments()`. Club Leaders and Teachers receive Visitor Schedule management through the manager APIs. |
| `attendance` | Check In | Yes | Yes | Yes | Placeholder | Renders placeholder text only. Student check-in, manual attendance, and QR attendance are not implemented. |
| `dashboard` | Dashboard | No | Yes | Yes | Functional, read-only attendance | Shows Today's dashboard and Upcoming Activities. Dashboard and future-availability APIs enforce management permission server-side. Attendance information is displayed but cannot be recorded. |
| `sessions` | Sessions & Events | No | No | Yes | Functional | Lists and manages sessions through Teacher-only server functions. |
| `members` | Members | No | No | Yes | Functional | Lists and manages members through Teacher-only server functions. |

### Dashboard subviews

`dashboard` currently contains two internal sections rather than separate top-level routes:

| Section | Student | Club Leader | Teacher | Status |
|---|---:|---:|---:|---|
| Today | No | Yes | Yes | Functional; attendance is read-only |
| Upcoming Activities | No | Yes | Yes | Functional |

### Current role navigation

#### Student

- Home
- Availability
- Volunteer Schedule
- Check In — placeholder

#### Club Leader

- Home
- Availability
- Visitor Schedules
- Check In — placeholder
- Dashboard

#### Teacher

- Home
- Availability
- Visitor Schedules
- Check In — placeholder
- Dashboard
- Sessions & Events
- Members

Reports and Settings do not have frontend routes. They must not be treated as implemented features. Teacher settings permission exists in the permission object, but no Settings interface or public Settings API is present.

## UI redesign acceptance checklist

Use representative data that includes:

- at least one session with a response deadline;
- Available, Unavailable, Unsure, and no-response members;
- a visitor assignment and an unavailable-assignment conflict;
- long Japanese and English session titles;
- long member names, notes, activity names, and locations;
- loading, empty, success, validation-error, and server-error states where practical.

### Desktop — 1440px wide

- [ ] The application is centred and no page-level horizontal scrollbar appears.
- [ ] Header, language selector, navigation, content, forms, and actions remain readable.
- [ ] All current routes can be opened for the authorised role.
- [ ] Management lists, filters, forms, summary counts, and detail sections do not overlap.
- [ ] Long user-entered and spreadsheet text wraps without being truncated unintentionally.
- [ ] Keyboard focus is visible on every interactive control.

### Laptop — 1024px wide

- [ ] No page-level horizontal scrollbar appears.
- [ ] Navigation remains discoverable and every visible destination can be reached.
- [ ] Three-column filters and forms remain usable without clipped labels or controls.
- [ ] Dashboard summary cards and Upcoming Activities counts remain legible.
- [ ] Primary, secondary, and destructive actions remain visually distinguishable.

### Tablet — 768px wide

- [ ] The interface works in portrait and landscape orientation.
- [ ] Navigation, filters, forms, and record actions do not overflow the viewport.
- [ ] Touch targets are at least 44 by 44 CSS pixels where practical.
- [ ] Opening, saving, cancelling, filtering, and refreshing can be completed by touch.
- [ ] The on-screen keyboard does not permanently hide the active field or save action.

### Mobile — 390px wide

- [ ] No page-level horizontal scrollbar appears.
- [ ] Navigation destinations remain reachable and their labels are not misleading.
- [ ] Availability response controls, private-note fields, and Save buttons are usable.
- [ ] Management actions stack without overlap and retain a clear priority.
- [ ] Dates, times, status labels, names, notes, and locations wrap safely.
- [ ] Content is usable at 200% browser zoom.

### Japanese

- [ ] Japanese is selected by default when no valid preference is stored.
- [ ] All navigation labels, headings, controls, validation messages, loading states, empty states, errors, and confirmations use the Japanese dictionary.
- [ ] Dates use Japanese conventions and the `Asia/Tokyo` time zone.
- [ ] Changing to Japanese rerenders the current view without losing an Availability draft.
- [ ] Internal English values and user-entered or spreadsheet text are not translated.

### English

- [ ] Selecting English updates all localised interface text.
- [ ] The preference survives a reload through `localStorage`.
- [ ] Dates use British English conventions and the `Asia/Tokyo` time zone.
- [ ] Changing to English rerenders the current view without losing an Availability draft.
- [ ] Internal English values remain unchanged in submitted data.

### Student account

- [ ] Home shows only the signed-in Student's personal data, notifications, and upcoming sessions.
- [ ] Availability reads and saves only the signed-in Student's response and private note.
- [ ] Volunteer Schedule shows only the signed-in Student's assignments.
- [ ] Dashboard, session management, member management, and manager visitor data are not available.
- [ ] Check In is clearly a placeholder and does not imply that attendance was recorded.

### Club Leader account

- [ ] Home and personal Availability load normally.
- [ ] Visitor Schedules supports the existing authorised management workflow.
- [ ] Dashboard Today and Upcoming Activities load club-wide management data.
- [ ] Private availability notes are visible only through authorised management responses.
- [ ] Sessions and Members management are not available.
- [ ] Attendance remains read-only or placeholder-only.

### Teacher account

- [ ] Home and personal Availability load normally.
- [ ] Dashboard Today and Upcoming Activities load.
- [ ] Visitor Schedules management loads and retains existing validation and conflict warnings.
- [ ] Sessions & Events management loads and retains create, edit, cancel, and protected-delete behaviour.
- [ ] Members management loads and retains role, active-status, final-Teacher, and protected-delete behaviour.
- [ ] Reports and Settings do not appear as working frontend routes.
- [ ] Attendance remains read-only or placeholder-only.

## Phase 0 regression boundary

Phase 0 must not change navigation, styling, layout, server APIs, permissions, sheet schemas, or internal English values. The Availability response-deadline template must contain exactly one valid paragraph element, and all existing Availability interactions must behave as before.
