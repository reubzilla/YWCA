# Application architecture

This document describes the code currently in the repository. Sections explicitly marked **Intended, not implemented** describe constraints or future direction from `AGENTS.md`, not existing behavior.

## Repository layout

```text
/
├── AGENTS.md            Repository rules and intended system constraints
├── PROJECT.md           Product scope, status, schemas, and deployment assumptions
├── ARCHITECTURE.md      This architecture description
├── README.md            Empty
├── TODO.md              Empty
├── CHANGELOG.md         Empty
├── package.json         Repository-local clasp commands and version
├── package-lock.json    Locked development-tool dependencies
├── .claspignore         Files permitted in an Apps Script push
└── src/
    ├── appsscript.json  Apps Script V8, time-zone, and web-app manifest
    ├── Auth.gs          HTML Service entry point
    ├── Code.gs          Constants, sheet names, roles, and internal values
    ├── Config.gs        Current-member lookup and permission calculation
    ├── SheetData.gs     Generic sheet-to-object reader
    ├── Data.gs          Upcoming-session retrieval and client mapping
    ├── Helpers.gs       Notifications and member-record matching
    ├── Index.html       Frontend document shell and ordered partial includes
    ├── Styles.html      CSS partial included by Index.html
    ├── Localization.html Translation dictionary and browser localisation helpers
    ├── BrowserHelpers.html Shared browser utility functions
    ├── Home.html        Home view rendering
    ├── Availability.html Availability rendering, saving, and event handlers
    ├── Dashboard.html   Management dashboard rendering and event handlers
    ├── Volunteer.html   Volunteer placeholder view
    ├── Attendance.html  Attendance placeholder view
    ├── App.html         Shared state, startup, navigation, and routing
    ├── Notifications.gs Date, time, and Boolean utilities
    ├── Portal.gs        Availability read/write API
    ├── Sessions.gs      Same-day cross-sheet aggregation and summaries
    └── Today.gs         Public dashboard API and authorization guard
```

There is no test suite or schema setup script. The repository has a local `clasp` development dependency. An ignored `.clasp.json` maps `src/` to the target project without committing its Script ID, and OAuth credentials remain outside the repository.

## Apps Script entry point

`doGet()` in `Auth.gs` creates and evaluates an HTML template from `Index`, then sets the page title from `CONFIG.APP_TITLE`.

This requires an Apps Script HTML file named `Index`. `src/Index.html` matches that name. The local `clasp` configuration uses `src/` as its `rootDir`.

## HTML partial and include mechanism

`include_(filename)` in `Code.gs` reads the raw contents of a trusted Apps Script HTML template for inclusion in the evaluated `Index` template. `Index.html` includes `Styles` inside its `<style>` element. Its application `<script>` then includes `BrowserHelpers`, `Localization`, `Home`, `Availability`, `Dashboard`, `Volunteer`, `Attendance`, and `App` in that order.

Browser helpers load before localisation because localisation rendering uses shared HTML escaping. View functions load before `App.html`, whose startup code executes only after every renderer has been declared. `Index.html` contains only the document shell and these ordered includes. CSS is in `Styles.html`, the single translation dictionary and translation helpers are in `Localization.html`, shared browser utilities are in `BrowserHelpers.html`, and each view has its own partial.

`App.html` owns the shared `portalData` and `currentView` state. Other partials update portal data through `updatePortalData()` and request a language-change rerender through `rerenderAfterLanguageChange()` rather than assigning App state directly. Availability draft state remains owned by `Availability.html`, and the selected dashboard session remains owned by `Dashboard.html`.

Apps Script requires unique filenames regardless of extension. The generic sheet reader therefore resides in `SheetData.gs`, leaving the `Dashboard` basename available for the frontend partial.

## Authentication flow

1. A server function calls `getCurrentMember_()`.
2. `Session.getActiveUser().getEmail()` supplies the signed-in account email.
3. The email is trimmed and lowercased.
4. `getMemberByEmail_()` reads the `Members` sheet and selects the first matching `Email` value.
5. Access fails if the email is unavailable, no member matches, or `Active` is not true/yes.
6. The complete member row is returned to the calling server function.

Authentication depends on the Apps Script deployment and Google Workspace policy exposing the active user's email. No school-domain check is implemented; registration in `Members` is the effective allowlist.

## Permission flow

`getPermissions_(member)` compares the trimmed `Role` value with the exact internal roles.

- Every active member receives own-schedule, availability-submission, and check-in permissions.
- `Club Leader` and `Teacher` receive dashboard, club-wide availability, attendance, and volunteer permissions.
- `Teacher` receives session, member, role, and settings-management permissions.

The frontend uses `canViewDashboard` to decide whether to show dashboard navigation. Server-side `requireDashboardAccess_()` independently protects both public dashboard functions.

`saveAvailability()` authenticates the member server-side, but does not explicitly consult `canSubmitAvailability`; that permission is currently true for every active member. Other declared management permissions do not yet protect any implemented management endpoints because those endpoints do not exist.

## Server-to-client data flow

The browser calls public global Apps Script functions through `google.script.run`. Success handlers render returned plain objects into the active view container; failure handlers display escaped error messages.

The intended initial flow is:

```text
DOMContentLoaded
  → getPortalData()
  → { user, permissions, notifications, sessions }
  → renderNavigation()
  → renderHome()
```

`getPortalData()` authenticates the current member and returns that member's profile, role-derived permissions, notifications, and upcoming sessions. It does not return other members' records.


Subsequent views independently request availability or dashboard data. Spreadsheet `Date` objects are converted to language-neutral strings before being returned to the browser. Date-only values use `YYYY-MM-DD`, time-only values use `HH:mm`, and date-time values include the `Asia/Tokyo` offset. The browser formats these values for `ja-JP` or `en-GB` when rendering.

## Availability save flow

1. The availability view calls `getAvailabilityPageData()`.
2. The server authenticates the current member.
3. It obtains active, non-cancelled sessions within `CONFIG.UPCOMING_WEEKS`.
4. It reads availability rows and attaches matching responses using `Member ID` or normalized email.
5. The browser renders radio options and an optional note.
6. On save, the browser sends only `sessionId`, `response`, and `reason` to `saveAvailability()`.
7. The server derives identity again, validates the input object, session ID, allowed response, and 500-character limit.
8. `getEditableSession_()` requires an active, non-cancelled session dated today or later.
9. A script lock protects the read/modify/write operation.
10. The first matching row is replaced, preserving its original `Submitted At`; otherwise a row is appended.
11. The server returns the saved values and a machine-readable update timestamp with the `Asia/Tokyo` offset.
12. The browser updates the card and attempts to refresh cached home data through the missing `getPortalData()` function.


Known limitation: duplicate availability rows are not prevented. When updating an existing row, columns not managed by `saveAvailability()` are preserved.

## Today's Engine flow

There is no function or module formally named “Today's Engine.” Its current functional equivalent is `buildTodaySessionData_(sessionId)` in `Sessions.gs`.

The flow is:

1. Find a session row by `Session ID`.
2. Map it to client-safe session data.
3. Load active members whose roles are `Student` or `Club Leader`; Teachers are excluded from attendance totals.
4. Load all availability, volunteer assignment, and attendance rows.
5. For each member, find the first matching record for the selected session using `Member ID` or email.
6. Ignore volunteer assignments whose normalized status is `cancelled` or `declined`.
7. Produce a member record containing availability, private reason, volunteer details, and attendance details.
8. Calculate totals and categorized groups, including volunteer/unavailable conflicts.

**Intended, partially implemented:** Today's Engine should remain the shared cross-sheet aggregation layer. The dashboard already consumes `buildTodaySessionData_()` rather than rebuilding those joins, but no separate engine abstraction exists.

## Dashboard flow

1. `getDashboardData()` calls `requireDashboardAccess_()`.
2. `getTodaySessions_()` returns active, non-cancelled sessions matching today's date, sorted by start time.
3. The first session is passed to `buildTodaySessionData_()`.
4. The browser renders a session selector when multiple sessions exist.
5. It displays totals, volunteer and availability groups, conflicts, and an attendance count.
6. Selecting or refreshing a session calls `getDashboardSession(sessionId)`, which repeats server-side dashboard authorization and calls the same aggregation function.

`getDashboardSession()` validates the supplied ID against the active, non-cancelled sessions returned for today before building dashboard data.

Attendance is read-only in the current dashboard. Manual and QR attendance operations are not implemented.

## Localisation approach

English is the canonical source language. `Localization.html` contains one `TRANSLATIONS` dictionary with English and Japanese catalogues and a `t()` interpolation helper used by client-rendered labels and messages. Japanese is selected by default. The header language selector stores a valid `ja` or `en` preference in `localStorage`, updates the document language, and rerenders the active view. Shared browser helpers format machine-readable dates as `ja-JP` or `en-GB` using `Asia/Tokyo`. Server-generated errors and notification text remain raw English or spreadsheet-derived data.

Date-only payloads are calendar values and must not be parsed as instants. The frontend parses their `YYYY-MM-DD` components explicitly before display. Date-time payloads represent instants and include the Tokyo offset, for example `2026-07-17T15:45:00+09:00`. During the migration, renderers prefer machine-readable properties such as `dateValue` and `todayDateValue` while accepting the previous display properties as fallbacks.

Spreadsheet and business values are currently English, including roles, availability values, session types, and assignment statuses.

Stored business values remain English and are not changed when the display language changes. Spreadsheet and user-entered content is rendered verbatim rather than passed through the translation helper.

## Public server API

The HTML frontend calls:

| Function | Present | Authorization and purpose |
|---|---|---|
| `getPortalData()` | Yes | Authenticates an active member and returns that member's profile, permissions, notifications, and sessions |
| `getAvailabilityPageData()` | Yes | Authenticates an active member and returns only that member's availability |
| `saveAvailability(submission)` | Yes | Authenticates the member and creates or updates that member's response |
| `getDashboardData()` | Yes | Requires Club Leader or Teacher dashboard access |
| `getDashboardSession(sessionId)` | Yes | Requires Club Leader or Teacher dashboard access |

`doGet()` is the public HTTP entry point but is not called through `google.script.run`.

Functions ending in `_` are internal by convention and are not called by the frontend.

## Security boundaries

Current server-enforced boundaries include:

- identity comes from `Session.getActiveUser()`, not client input;
- the account must match an active `Members` row;
- availability reads and writes are scoped to the authenticated member;
- dashboard APIs repeat authorization on the server;
- availability input is validated server-side;
- availability writes use `LockService`;
- spreadsheet-derived text is normally escaped before insertion into generated HTML;
- spreadsheet and script identifiers are not sent to the client by current code.

Required boundaries from `AGENTS.md` include keeping the database spreadsheet inaccessible to students and never returning other students' private notes, attendance, or personal data to student clients. The current personal availability endpoint follows that rule. Dashboard payloads contain club-wide private and attendance data, but the dashboard functions enforce Club Leader or Teacher access.

When both the current member and a related row have `Member ID`, matching requires those IDs to agree. Email is used only when a row lacks a member ID, reducing the chance that malformed rows disclose data to the wrong member.

Remaining risks include deployment-dependent email visibility, absence of a domain restriction, lack of uniqueness constraints, and ambiguous date boundaries when script and spreadsheet time zones differ. Direct spreadsheet permissions and actual web-app deployment settings are outside the repository and cannot be verified here.
