# Repository instructions

## Project purpose

This is a Google Apps Script web application for the Miyagi Gakuin Junior and Senior High School YWCA club.

The club normally meets on Monday and Friday. On Mondays, two or three students may visit a local children's after-school centre. On Fridays, two or three students may visit a local kindergarten. There are also irregular activities such as open campus days, the school festival, and Christmas markets.

## Technology

- Google Apps Script backend
- Google Sheets database
- HTML Service frontend
- CSS and vanilla JavaScript
- Google Workspace account authentication
- No external frontend framework

Do not add dependencies without explicit approval.

## Roles and permissions

Internal role values must remain exactly:

- `Student`
- `Club Leader`
- `Teacher`

Students may:

- view upcoming sessions;
- submit and update their own availability;
- add an optional private note;
- view their own volunteer assignments;
- eventually check themselves in.

Club Leaders may additionally:

- view the management dashboard;
- view club-wide availability;
- manage day-to-day attendance;
- help manage volunteer assignments.

Teachers may additionally:

- manage sessions;
- manage members and roles;
- manage settings;
- access all management features.

## Security

- Never rely only on client-side role checks. Validate permissions again in server-side Apps Script functions.
- Students must never receive other students' private notes, attendance information, or personal data.
- Do not expose spreadsheet IDs, script IDs, tokens, or secrets in client-side code.
- All user identity must come from the signed-in Google Workspace account and the `Members` sheet.
- Do not make the database spreadsheet accessible to students.
- Validate all client submissions on the server.
- Escape user-provided text before inserting it into HTML.
- Use `LockService` when multiple users may write to the same sheet.

## Localisation

- English is the canonical source language.
- Japanese is the default display language; English is optional through the language selector.
- Store the browser preference in `localStorage`.
- All new user-facing text must come from the localisation dictionary.
- Do not hard-code visible Japanese or English inside render functions.
- Keep spreadsheet and business-logic values in English. Translate them only when displaying them.

Internal availability values must remain:

- `Available`
- `Unavailable`
- `Unsure`

Internal session types must remain:

- `Regular`
- `Event`
- `Cancelled`

Internal assignment statuses may include:

- `Assigned`
- `Confirmed`
- `Declined`
- `Cancelled`

## Data model

Preserve these existing sheet column names unless an approved migration is included. Do not change column names silently.

### Members

- `Member ID`
- `Name`
- `Email`
- `Grade`
- `Role`
- `Active`
- `Join Date`
- `Leave Date`

### Sessions

- `Session ID`
- `Date`
- `Title`
- `Session Type`
- `Start Time`
- `End Time`
- `Response Deadline`
- `Active`
- `Notes`

### Availability

- `Session ID`
- `Member ID`
- `Student Email`
- `Response`
- `Reason`
- `Submitted At`
- `Updated At`

### Volunteer Assignments

- `Session ID`
- `Member ID`
- `Student Email`
- `Activity`
- `Location`
- `Departure Time`
- `Assignment Status`
- `Notes`

### Attendance

- `Session ID`
- `Member ID`
- `Student Email`
- `Attendance Status`
- `Check-in Time`
- `Method`
- `Teacher Note`

### Settings

- `Setting`
- `Value`

## Architecture

- Sessions are the central records.
- Availability, volunteer assignments, and attendance refer to sessions through `Session ID`.
- Member records are connected through `Member ID` and school email.
- Today's Engine combines sessions, members, availability, volunteer assignments, and attendance.
- The dashboard consumes Today's Engine rather than duplicating its logic.
- Keep business logic in `.gs` files.
- Keep presentation and browser interaction in HTML partials.

## Frontend structure

`Index.html` must remain a lightweight document shell.

Do not add substantial CSS, localisation dictionaries, view rendering,
business logic, or event-handling code directly to `Index.html`.

Place frontend code in the appropriate HTML partial:

- `Styles.html`
- `Localization.html`
- `BrowserHelpers.html`
- `Components.html`
- `AppShell.html`
- `Home.html`
- `PersonalNotifications.html`
- `Availability.html`
- `UpcomingActivities.html`
- `Dashboard.html`
- `Volunteer.html`
- `VisitorScheduleManagement.html`
- `Attendance.html`
- `SessionManagement.html`
- `MemberManagement.html`
- `App.html`

Before adding a new frontend function, identify which module owns it.
Shared browser utilities belong in `BrowserHelpers.html`, reusable
presentation builders belong in `Components.html`, and responsive shell
rendering belongs in `AppShell.html`, not in a feature view module.

## Coding rules

- Use vanilla JavaScript.
- Prefer small, reusable functions.
- Avoid unrelated refactors.
- Preserve current behavior unless the task explicitly changes it.
- Keep the layout mobile friendly.
- Do not add dependencies without explicit approval.

## Workflow

Before editing:

1. Read `AGENTS.md`.
2. Read `PROJECT.md` and `ARCHITECTURE.md`.
3. Inspect every file affected by the task.
4. Explain the intended changes.
5. List the files that will be modified.
6. Identify any schema or deployment implications.

After editing:

1. Review the full diff.
2. Check JavaScript and Apps Script syntax.
3. Verify that every `google.script.run` call has a matching public server function.
4. Verify that function names are not duplicated across files.
5. Check that internal English values have not been translated.
6. State what could and could not be tested locally.
7. Provide a manual Apps Script testing checklist.
8. Do not claim the live web app has been tested or deployed.
