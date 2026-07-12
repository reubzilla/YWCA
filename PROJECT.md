# YWCA Club Portal

## Application purpose

This repository contains a Google Apps Script web application for the Miyagi Gakuin Junior and Senior High School YWCA club. It is intended to coordinate regular Monday and Friday club sessions, small volunteer visits to a children's after-school centre and kindergarten, and irregular activities such as open campus days, the school festival, and Christmas markets.

The application uses a Google Sheet as its database and identifies users through their signed-in Google Workspace account.

## User roles

Role values stored in the `Members` sheet are:

- `Student`
- `Club Leader`
- `Teacher`

The current permission map grants every active registered member availability submission, check-in, and own-schedule permissions. Club Leaders and Teachers receive dashboard, club-wide availability, attendance, and volunteer-management permissions. Teachers additionally receive session, member, role, and settings-management permissions.

Some permissions describe intended features that do not yet have corresponding interfaces or server functions.

## Expected workflows

### Students

The intended student workflow is to:

1. Sign in with a school Google Workspace account registered in `Members`.
2. View active sessions occurring within the next eight weeks.
3. submit or update `Available`, `Unavailable`, or `Unsure` for a session;
4. optionally add a private note of up to 500 characters;
5. view personal volunteer assignments;
6. eventually check in for a same-day session.

The availability interface and save operation exist. Personal volunteer scheduling and check-in are placeholders.

### Club Leaders and Teachers

Club Leaders and Teachers can open a same-day management dashboard. It combines active students and Club Leaders with their availability, volunteer assignment, and attendance records. It displays totals, categorized member lists, volunteer conflicts, and an attendance summary.

Day-to-day attendance editing and volunteer management are intended but not implemented. Teacher-only session, member, role, and settings management are also not implemented.

## Current working features

The following code paths are present:

- an HTML Service entry point serving `Index.html`;
- signed-in member lookup by normalized Google Workspace email;
- active-member enforcement and role-derived permissions;
- generic conversion of sheet rows into objects using the header row;
- active, non-cancelled upcoming-session retrieval and formatting;
- member-specific availability retrieval;
- server-validated availability create/update with `LockService`;
- optional availability notes limited to 500 characters;
- upcoming missing-response and volunteer-assignment notification generation;
- same-day session aggregation across members, availability, volunteer assignments, and attendance;
- a role-protected management dashboard with summaries and conflict detection;
- responsive, framework-free HTML, CSS, and browser JavaScript.


The initial portal payload is provided by `getPortalData()`, which returns the authenticated member's profile, permissions, notifications, and upcoming sessions.

## Incomplete features
- The volunteer schedule view is placeholder text.
- Student, QR, and manual attendance check-in are not implemented.
- Attendance can be read for the dashboard but cannot be recorded through the application.
- Volunteer assignments can be read but cannot be managed through the application.
- Session, member, role, and settings management are not implemented.
- Response deadlines are displayed but not enforced by `saveAvailability()`.
- English is the canonical frontend language and visible client labels come from an English translation dictionary. There is not yet a language selector, Japanese catalogue, or saved browser preference.
- The frontend is not split into HTML partials.
- There is no repository-provided sheet setup, migration, or test suite. Local Apps Script source synchronization is configured through `clasp`.

## Future planned features

The repository instructions establish the following intended direction. These items are not implemented unless explicitly listed above:

- a Japanese translation catalogue, language selector, and `localStorage` preference, while retaining English as the canonical source language;
- personal volunteer assignment views;
- same-day student check-in;
- manual and QR attendance workflows;
- Club Leader and Teacher volunteer and attendance management;
- Teacher management of sessions, members, roles, and settings;
- HTML partials separating presentation and browser interaction;
- a clearly defined Today's Engine abstraction shared by dashboard features.

## Google Sheets schemas

These column names are the repository's prescribed schemas and must not be changed without an approved migration. `Join Date`, `Leave Date`, and the `Settings` columns are prescribed but are not currently read by application code.

### Members

1. `Member ID`
2. `Name`
3. `Email`
4. `Grade`
5. `Role`
6. `Active`
7. `Join Date`
8. `Leave Date`


### Sessions

1. `Session ID`
2. `Date`
3. `Title`
4. `Session Type`
5. `Start Time`
6. `End Time`
7. `Response Deadline`
8. `Active`
9. `Notes`

### Availability

1. `Session ID`
2. `Member ID`
3. `Student Email`
4. `Response`
5. `Reason`
6. `Submitted At`
7. `Updated At`

### Volunteer Assignments

1. `Session ID`
2. `Member ID`
3. `Student Email`
4. `Activity`
5. `Location`
6. `Departure Time`
7. `Assignment Status`
8. `Notes`

### Attendance

1. `Session ID`
2. `Member ID`
3. `Student Email`
4. `Attendance Status`
5. `Check-in Time`
6. `Method`
7. `Teacher Note`

### Settings

1. `Setting`
2. `Value`

Internal business values remain English. Roles are `Student`, `Club Leader`, and `Teacher`; availability values are `Available`, `Unavailable`, and `Unsure`; session types are `Regular`, `Event`, and `Cancelled`.

## Deployment assumptions

The source assumes:

- a Google Apps Script project containing the `.gs` files and an HTML file named `Index`;
- access to an active spreadsheet containing all six sheets with matching headers;
- a spreadsheet time zone, with `Asia/Tokyo` used as a fallback;
- a V8-compatible Apps Script runtime because the code uses modern JavaScript syntax;
- a web-app deployment configuration in which `Session.getActiveUser().getEmail()` identifies the signed-in school user;
- students use the web app without direct access to the database spreadsheet.

The repository uses a local `clasp` installation and maps `src/` to an existing Apps Script project through an ignored `.clasp.json`. The Script ID and OAuth credentials are deliberately excluded from Git. The tracked `src/appsscript.json` preserves the existing V8, `Asia/Tokyo`, domain-only web-app configuration.

After installing dependencies, use `npm run apps-script:status` to inspect the files that would be uploaded and `npm run apps-script:push` to replace the online project source. A push does not create or update a deployment version automatically. Because Apps Script pushes replace the complete online source set, review `clasp status` and the Git diff before every push.
