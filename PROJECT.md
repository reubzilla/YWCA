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

The current student workflow is to:

1. Sign in with a school Google Workspace account registered in `Members`.
2. open an action-first Today view for today's activity, personal assignment, availability status, next activity, and urgent notices;
3. open My Availability, find unanswered sessions first, and submit or update `Available`, `Unavailable`, or `Unsure` in a focused editor;
4. optionally add a private note of up to 500 characters;
5. view the next personal assignment, future assignments, and assignment history;
6. open read-only Notifications that route to the relevant personal workflow;
7. eventually check in for a same-day session.

The availability interface and save operation exist. The personal volunteer schedule shows only the signed-in member's assignments. Check-in remains a placeholder.

### Club Leaders and Teachers

Club Leaders and Teachers can open a same-day Today workspace. It combines active students and Club Leaders with their availability, volunteer assignment, and attendance records. Operational conflicts and missing attendance are shown before neutral totals, followed by visitor assignments, grouped member status, and a read-only attendance summary.

Upcoming Activities is a separate Planning destination. It lists active Regular and Event sessions after today, defaults to the next eight weeks, and provides club-wide response totals, response deadlines, attention indicators, and detailed groups for active Students and Club Leaders. Both the list and detail APIs require club-wide availability permission.

Day-to-day attendance editing is intended but not implemented. Club Leaders and Teachers can manage visitor schedules/Volunteer Assignments. Teachers can also manage sessions and events, and club member records, roles, and active status. Teacher-only settings management is not implemented.

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
- a role-protected Today workspace with priority alerts, action-oriented summaries, visitor details, grouped member status, conflict detection, and read-only attendance;
- a separate permission-protected Upcoming Activities Planning route with date, session-type, and attention filters, future response totals, response deadlines, private management notes, visitor assignments, and conflict details;
- Teacher-only session and event creation, editing, cancellation, filtering, and integrity-protected deletion;
- Teacher-only member creation, editing, role changes, activation, deactivation, filtering, and integrity-protected deletion;
- locked M001-style Member ID generation, normalized unique member emails, final-active-Teacher protection, and strong confirmation before a Teacher removes their own management access;
- signed-in-member-only volunteer schedule display;
- an action-first Student Today view composed from signed-in-member-only availability and assignment APIs;
- a compact, filterable My Availability list with focused editing, unsaved-change protection, and read-only past-activity history;
- a personal assignment schedule divided into today's assignment, next assignment, future assignments, and history;
- a dedicated read-only Notifications route with actions into Availability, My Assignments, or Today;
- Teacher and Club Leader visitor-schedule management with multi-member assignment, availability warnings, filtering, locked duplicate prevention, cancellation, and safe future deletion;
- a shared responsive management workspace for Sessions & Events, Members, and Visitor Schedules: desktop master-detail, focused tablet/mobile detail and editor states, compact filters, inline validation, and accessible confirmation/unsaved-change dialogs;
- language-neutral date payloads with Japanese and British English browser formatting;
- shared Asia/Tokyo calendar classification for Today, Upcoming, and Past session behavior;
- a role-aware single-page route registry that separates personal assignments from manager visitor coordination;
- a responsive application shell with a persistent desktop sidebar, tablet drawer, and role-specific mobile navigation;
- semantic design tokens and small framework-free base UI components;
- responsive, framework-free HTML, CSS, and browser JavaScript.


The initial portal payload is provided by `getPortalData()`, which returns the authenticated member's profile, permissions, notifications, and active current/future sessions.

## Incomplete features
- Student, QR, and manual attendance check-in are not implemented.
- Attendance can be read for the dashboard but cannot be recorded through the application.
- Attendance is not exposed as a working navigation destination while it remains incomplete.
- Settings management is not implemented.
- English is the canonical frontend source language. A single English/Japanese dictionary supplies client labels, Japanese is the default, and the language selector stores the user's preference in `localStorage`.
- The frontend is split into HTML partials for styles, localisation, shared browser utilities, application routing, and each view; `Index.html` contains only the document shell and ordered includes.
- There is no repository-provided sheet setup, migration, or test suite. Local Apps Script source synchronization is configured through `clasp`.

## Future planned features

The repository instructions establish the following intended direction. These items are not implemented unless explicitly listed above:

- same-day student check-in;
- manual and QR attendance workflows;
- Club Leader and Teacher attendance management;
- Teacher management of settings;
- a clearly defined Today's Engine abstraction shared by dashboard features.

## Google Sheets schemas

These column names are the repository's prescribed schemas and must not be changed without an approved migration. `Join Date` and `Leave Date` are read and written by member management. The `Settings` columns are prescribed but are not currently read by application code.

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

Internal business values remain English. Roles are `Student`, `Club Leader`, and `Teacher`; availability values are `Available`, `Unavailable`, and `Unsure`; session types are `Regular`, `Event`, and `Cancelled`; assignment statuses are `Assigned`, `Confirmed`, `Declined`, and `Cancelled`.

## Deployment assumptions

The source assumes:

- a Google Apps Script project containing the `.gs` files and an HTML file named `Index`;
- access to an active spreadsheet containing all six sheets with matching headers;
- `Asia/Tokyo` as the application business time zone, with the database spreadsheet expected to use the same time zone;
- a V8-compatible Apps Script runtime because the code uses modern JavaScript syntax;
- a web-app deployment configuration in which `Session.getActiveUser().getEmail()` identifies the signed-in school user;
- students use the web app without direct access to the database spreadsheet.

The repository uses a local `clasp` installation and maps `src/` to an existing Apps Script project through an ignored `.clasp.json`. The Script ID and OAuth credentials are deliberately excluded from Git. The tracked `src/appsscript.json` preserves the existing V8, `Asia/Tokyo`, domain-only web-app configuration.

After installing dependencies, use `npm run apps-script:status` to inspect the files that would be uploaded and `npm run apps-script:push` to replace the online project source. A push does not create or update a deployment version automatically. Because Apps Script pushes replace the complete online source set, review `clasp status` and the Git diff before every push.
