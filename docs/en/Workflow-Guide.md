# Workflow Guide

English is the canonical version of this guide.

## Availability response workflow

1. A Teacher creates an active, non-cancelled session.
2. When its date is within the next eight weeks, the session appears in the upcoming-session window.
3. The Student or other active member opens Availability.
4. The member saves `Available`, `Unavailable`, or `Unsure`, with an optional private note.
5. The server validates the session and response and writes the member's own Availability row under a lock.
6. Home refreshes its notification data after a successful save.
7. Club Leaders and Teachers can review the response in the same-day Dashboard when the session date arrives.

**Coming Soon:** automatic enforcement of Response Deadline during availability saving.

## Personal assignment workflow

1. A Club Leader or Teacher creates a Visitor Schedule assignment.
2. The signed-in Student or Club Leader opens their personal Volunteer Schedule.
3. The server identifies the signed-in member and returns only that member's assignments.
4. The member reviews the session, activity, location, departure time, status, and notes.

## Visitor Schedule management workflow

1. A Club Leader or Teacher selects an active upcoming session.
2. The manager reviews eligible active Students and Club Leaders and their current availability responses.
3. The manager selects one or more members and enters assignment details.
4. The server validates permissions, the session, members, status, departure time, and duplicate Session ID/Member ID combinations.
5. An `Unavailable` response requires manager confirmation; `Unsure` or no response produces a notice.
6. The assignment is saved under a lock and becomes available to the member's personal view and the same-day Dashboard.
7. Unsafe or historical removals use `Cancelled`; only safe future assignments can be permanently deleted.

## Same-day Dashboard workflow

1. A Club Leader or Teacher opens Dashboard.
2. The server finds active, non-cancelled sessions for today's date in `Asia/Tokyo`.
3. The selected session is combined with active Students and Club Leaders, Availability, Volunteer Assignments, and Attendance.
4. The browser displays totals, grouped availability, scheduled volunteers, conflicts, and an attendance summary.
5. Private availability reasons and attendance information remain limited to authorised managers.

**Coming Soon:** creating or editing Attendance records from the portal.

## Session lifecycle workflow

1. A Teacher creates a session; the server generates a readable unique Session ID.
2. The Teacher can edit its supported fields.
3. Cancellation preserves the row as inactive with Session Type `Cancelled`.
4. Permanent deletion checks Availability, Volunteer Assignments, and Attendance.
5. Linked records block deletion, so cancellation is used to preserve history.

## Member lifecycle workflow

1. A Teacher creates a member; the server generates the next `M001`-style Member ID.
2. The Teacher can edit profile fields, role, dates, and active status.
3. Deactivation sets Active to false and uses a Leave Date.
4. Permanent deletion checks all linked Availability, Volunteer Assignment, and Attendance records.
5. Linked history blocks deletion, so deactivation is used instead.
6. Final-active-Teacher and self-access protections are applied before access can be removed.

## Language-change workflow

1. The user selects Japanese or English.
2. The preference is stored in browser local storage.
3. Static interface text and the current view rerender from the single localisation dictionary.
4. Dates use Japanese or British English conventions in `Asia/Tokyo`.
5. Internal values remain English, while names, titles, notes, activities, and locations remain unchanged.

## Coming Soon

- Student check-in workflow.
- QR and manual attendance workflows.
- Teacher Settings workflow.
