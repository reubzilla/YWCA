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

- Japanese is the default language.
- English is optional through a language selector.
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
