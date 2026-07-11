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

The complete application cannot currently initialize because the browser calls `getPortalData()`, which is not present in the server source.

## Incomplete features

- `getPortalData()` and the initial home-page data response are missing.
- The volunteer schedule view is placeholder text.
- Student, QR, and manual attendance check-in are not implemented.
- Attendance can be read for the dashboard but cannot be recorded through the application.
- Volunteer assignments can be read but cannot be managed through the application.
- Session, member, role, and settings management are not implemented.
- Response deadlines are displayed but not enforced by `saveAvailability()`.
- There is no localisation dictionary, language selector, or saved browser preference.
- The frontend is not split into HTML partials.
- There is no repository-provided sheet setup, migration, testing, or deployment tooling.

## Future planned features

The repository instructions establish the following intended direction. These items are not implemented unless explicitly listed above:

- Japanese-first localisation with optional English, a language selector, and `localStorage` preference;
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
