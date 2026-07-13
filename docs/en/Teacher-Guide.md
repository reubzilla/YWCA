# Teacher Guide

English is the canonical version of this guide.

## Access and responsibilities

Teachers can use Student and Club Leader functions and can additionally manage Sessions & Events and Members. Every management read and write is protected by a server-side Teacher permission check.

## Student and Club Leader functions

Teachers can:

- view Home and upcoming sessions;
- save their own availability;
- use the same-day Dashboard;
- manage Visitor Schedules.

See the Student Guide and Club Leader Guide for those workflows.

## Manage Sessions & Events

Open **Sessions & Events** to list upcoming and recent sessions. The list can be filtered by date and session type.

### Create or edit a session

1. Open the session form.
2. Enter the required Date and Title.
3. Select the internal Session Type: `Regular`, `Event`, or `Cancelled`.
4. Enter Start Time, End Time, Response Deadline, Active status, and Notes as appropriate.
5. Save the session.

The server generates readable unique Session IDs. End Time cannot be earlier than Start Time. A Response Deadline after the session begins requires explicit confirmation.

### Cancel or delete a session

- Cancellation keeps the row, changes Session Type to `Cancelled`, and makes the session inactive.
- Permanent deletion is allowed only when no Availability, Volunteer Assignment, or Attendance row refers to the Session ID.
- If linked records exist, deletion is blocked and cancellation should be used instead.

## Manage Members

Open **Members** to search by name or email and filter by active status, role, or grade.

### Create or edit a member

1. Enter Name and Email.
2. Set Grade, Role, Active status, Join Date, and Leave Date as appropriate.
3. Save the member.

Emails are normalised to lowercase and must be unique. Roles must remain `Student`, `Club Leader`, or `Teacher`. Member IDs are generated in the existing `M001` style. Leave Date cannot be earlier than Join Date.

### Activate, deactivate, or delete a member

- Deactivation is the normal removal method and requires a Leave Date.
- Activation clears the previous Leave Date.
- Permanent deletion is allowed only when no Availability, Volunteer Assignment, or Attendance rows are linked by Member ID or email.
- The final active Teacher cannot be deactivated, demoted, or deleted.
- A Teacher removing their own management access must confirm with their signed-in email.

## Use the Dashboard and Visitor Schedules

The Dashboard is limited to active sessions taking place today. Visitor Schedules manage future volunteer assignments for active Students and Club Leaders. Follow the Club Leader Guide and protect all private member data shown in management views.

## Change language

Use the header selector to switch between Japanese and English. Internal spreadsheet values remain English; only interface presentation is translated.

## Coming Soon

- Manual attendance recording and attendance management.
- Student QR and same-day check-in.
- Teacher Settings management.

The existing Settings permission does not currently have a working interface or public management API.

## Troubleshooting

- Check the member's normalised email, role, and active status when access is incorrect.
- Correct duplicate or malformed spreadsheet records before retrying a blocked operation.
- Prefer cancellation or deactivation when historical records must be preserved.
- Review the relevant sheet headers if a server error reports missing data columns.
