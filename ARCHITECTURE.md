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
├── appscript.json       Empty and not the standard Apps Script manifest name
└── src/
    ├── Auth.gs          HTML Service entry point
    ├── Code.gs          Constants, sheet names, roles, and internal values
    ├── Config.gs        Current-member lookup and permission calculation
    ├── Dashboard.gs     Generic sheet-to-object reader
    ├── Data.gs          Upcoming-session retrieval and client mapping
    ├── Helpers.gs       Notifications and member-record matching
    ├── Index.html       Entire frontend: HTML, CSS, and browser JavaScript
    ├── Notifications.gs Date, time, and Boolean utilities
    ├── Portal.gs        Availability read/write API
    ├── Sessions.gs      Same-day cross-sheet aggregation and summaries
    └── Today.gs         Public dashboard API and authorization guard
```

There is no test suite, dependency manifest, `.clasp.json`, schema setup script, or deployment script.

## Apps Script entry point

`doGet()` in `Auth.gs` returns `HtmlService.createHtmlOutputFromFile('Index')` and sets the page title from `CONFIG.APP_TITLE`.

This requires an Apps Script HTML file named `Index`. `src/Index.html` matches that name, but the repository does not include tooling that maps the local `src/` directory into an Apps Script project.

## HTML partial and include mechanism

There is no include mechanism in the current code. `doGet()` uses `createHtmlOutputFromFile()`, not an evaluated HTML template. There is no `include()` helper and no `<?!= ... ?>` inclusion syntax.

All markup, styles, translations, rendering, event handlers, and `google.script.run` calls are contained in `Index.html`.

**Intended, not implemented:** presentation and browser interaction should be divided into HTML partials while business logic remains in `.gs` files.

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

The browser calls public global Apps Script functions through `google.script.run`. Success handlers render returned plain objects into `Index.html`; failure handlers display escaped error messages.

The intended initial flow is:

```text
DOMContentLoaded
  → getPortalData()
  → { user, permissions, notifications, sessions }
  → renderNavigation()
  → renderHome()
```

This flow is broken: `getPortalData()` is called by the browser but no server implementation exists. The expected return shape is inferred from frontend property access and is not produced anywhere in the repository.

Subsequent views independently request availability or dashboard data. Spreadsheet `Date` objects are converted to formatted strings before being returned to the browser.

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
11. The server returns the saved values and formatted update time.
12. The browser updates the card and attempts to refresh cached home data through the missing `getPortalData()` function.
