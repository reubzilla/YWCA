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
    ├── Components.html  Shared presentation primitives and overlay helpers
    ├── AppShell.html    Responsive shell and navigation rendering
    ├── Home.html        Action-first Student Today rendering
    ├── PersonalNotifications.html Dedicated personal Notifications view
    ├── Availability.html Availability rendering, saving, and event handlers
    ├── UpcomingActivities.html Future availability list and detail view
    ├── Dashboard.html   Management dashboard rendering and event handlers
    ├── Volunteer.html   Signed-in member's volunteer schedule
    ├── VisitorScheduleManagement.html Manager visitor-schedule view
    ├── Attendance.html  Attendance placeholder view
    ├── App.html         Shared state, startup, navigation, and routing
    ├── Notifications.gs Date, time, and Boolean utilities
    ├── Portal.gs        Availability read/write API
    ├── Sessions.gs      Same-day cross-sheet aggregation and summaries
    ├── FutureAvailability.gs Permission-protected future aggregation
    ├── ManageSessions.gs Teacher-only session and event management
    ├── SessionManagement.html Teacher session-management view
    ├── ManageMembers.gs Teacher-only member management
    ├── MemberManagement.html Teacher member-management view
    ├── VolunteerAssignments.gs Personal and managed Volunteer Assignment APIs
    └── Today.gs         Public dashboard API and authorization guard
```

There is no test suite or schema setup script. The repository has a local `clasp` development dependency. An ignored `.clasp.json` maps `src/` to the target project without committing its Script ID, and OAuth credentials remain outside the repository.

## Apps Script entry point

`doGet()` in `Auth.gs` creates and evaluates an HTML template from `Index`, then sets the page title from `CONFIG.APP_TITLE`.

This requires an Apps Script HTML file named `Index`. `src/Index.html` matches that name. The local `clasp` configuration uses `src/` as its `rootDir`.

## HTML partial and include mechanism

`include_(filename)` in `Code.gs` reads the raw contents of a trusted Apps Script HTML template for inclusion in the evaluated `Index` template. `Index.html` includes `Styles` inside its `<style>` element. Its application `<script>` then includes `BrowserHelpers`, `Localization`, `Components`, `Home`, `PersonalNotifications`, `Availability`, `UpcomingActivities`, `Dashboard`, `Volunteer`, `VisitorScheduleManagement`, `Attendance`, `SessionManagement`, `MemberManagement`, `AppShell`, and `App` in that order.

Browser helpers load before localisation because localisation rendering uses shared HTML escaping. Components load after localisation so their accessible controls can use translated labels. View functions load before `AppShell.html` and `App.html`; the route registry is therefore created only after every renderer has been declared. `Index.html` contains semantic shell landmarks, empty overlay hosts, and the ordered includes. CSS is in `Styles.html`, the single translation dictionary and translation helpers are in `Localization.html`, shared browser utilities are in `BrowserHelpers.html`, and each feature view retains its own partial.

`Components.html` also owns the immediately reused management presentation builders: `buildManagementLayout()`, `buildDetailHeader()`, `buildFormSection()`, and `buildManagementFilterChips()`. These are string-rendering helpers rather than a component framework. Sessions, Members, and Visitor Schedules keep their own records, filters, selection, drafts, event handlers, and `google.script.run` calls in their feature partials.

`App.html` owns `portalData`, the public `currentRouteId`, a temporary legacy `currentView`, and one pending in-memory personal route target. It also owns the drawer-open and mobile-sheet-open state. `AppShell.html` renders those states but does not make permission decisions. Notification actions can target an Availability or personal Assignment Session ID without introducing URL routing. Availability owns its filters, selection, focused editor, and drafts; Volunteer owns personal assignment grouping; Dashboard owns the selected operational Today session; and Upcoming Activities owns Planning filters and selection.

Apps Script requires unique filenames regardless of extension. The generic sheet reader therefore resides in `SheetData.gs`, leaving the `Dashboard` basename available for the frontend partial.

## Frontend routing and responsive shell

`ROUTE_REGISTRY` in `App.html` is the single client-side route definition. Each entry declares its ID, localisation key, roles, optional existing permission flag, navigation group, renderer adapter, icon identifier, desktop visibility, mobile placement, and enabled state. Client visibility is convenience only; all protected server functions continue to authorize independently.

The active routes are:

- `today`: an action-first personal Today view for Students and the operational Today workspace for Club Leaders and Teachers;
- `visitor-coordination`: existing Visitor Schedule management for Club Leaders and Teachers;
- `planning`: the independent Upcoming Activities Planning view;
- `sessions`: Teacher-only Session management;
- `members`: Teacher-only Member management, labelled People in the shell;
- `availability`: the signed-in member's Availability view;
- `assignments`: the signed-in member's personal Volunteer Assignment view;
- `notifications`: the signed-in member's dedicated read-only notification list, with actions into personal routes.

The previous `home`, `dashboard`, and `volunteer` IDs are accepted only through `selectView()` as compatibility aliases for existing event handlers. Attendance is not registered because its view is still a placeholder. Invalid or inaccessible route IDs fall back to the first permitted route, which is `today`.

Students receive only `today`, `availability`, `assignments`, and `notifications`. Club Leaders have separate operational routes (`today`, `visitor-coordination`, and `planning`) and personal routes (`availability`, `assignments`, and `notifications`). Personal assignments never share a route with visitor management, and personal availability never shares a route with club-wide planning.

At 1024 CSS pixels and above, the shell uses a persistent 252-pixel sidebar. Between 768 and 1023 pixels it uses a labelled navigation drawer. Below 768 pixels it uses no more than five role-specific bottom actions. Teacher mobile navigation is Today, Planning, People, Personal, and More. Personal and More open a shared side-panel component containing secondary routes, language controls, and the signed-in account summary.

The three management routes share a second responsive pattern without changing the route registry. At 1200 CSS pixels and above, the filtered record list and detail/editor pane are visible together. From 768 through 1199 pixels, and on mobile below 768 pixels, selecting or creating a record changes the workspace to a focused detail/editor state with an explicit Back action. Filters collapse below 1024 pixels, form fields stack on mobile, and destructive actions remain visually separate from ordinary editing and status changes.

Each management module owns a serializable form draft. `Components.html` exposes a single management navigation guard and accessible Dialog-based confirmation helper. Attempting to leave a dirty editor, use its Back action, or select another record opens a localised discard warning. Changing language rerenders the current route without discarding the module draft. Successful saves clear the guard before reloading data.

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

The Upcoming Activities section uses the existing `canViewAllAvailability` permission directly. `getUpcomingActivities()` and `getUpcomingActivityDetail()` each call `requireFutureAvailabilityAccess_()` before validating filters or reading club-wide data. Teachers and Club Leaders currently receive this permission; Students do not.

`saveAvailability()` authenticates the member server-side, but does not explicitly consult `canSubmitAvailability`; that permission is currently true for every active member. Every public session-management endpoint calls `requireSessionTeacherAccess_()`, which authenticates the member and requires `canManageSessions`. Every public member-management endpoint calls `requireMemberTeacherAccess_()`, which authenticates the member and requires `canManageMembers`. Visitor-schedule management endpoints independently require `canManageVolunteers`, which is granted to Club Leaders and Teachers. The personal volunteer endpoint requires own-schedule access and derives identity server-side. Club Leaders can manage visitor schedules and use the operational dashboard but cannot read or mutate session- or member-management data.

## Server-to-client data flow

The browser calls public global Apps Script functions through `google.script.run`. Success handlers render returned plain objects into the active view container; failure handlers display escaped error messages.

The intended initial flow is:

```text
DOMContentLoaded
  → getPortalData()
  → { user, permissions, notifications, sessions }
  → validate the default route against ROUTE_REGISTRY
  → render the responsive application shell
  → render Home for Students or Today Dashboard for managers
```

`getPortalData()` authenticates the current member and returns that member's profile, role-derived permissions, notifications, and upcoming sessions. It does not return other members' records.

## Personal Today and notification flow

For a Student, the `today` renderer combines the cached `getPortalData()` payload with `getAvailabilityPageData()` and `getMyVolunteerAssignments()`. The two additional APIs independently derive the signed-in member server-side. Student Today therefore shows only that member's response, private note state, and assignments. It orders urgent response action, today's session, today's assignment, today's availability, the next session, and a short notification summary.

`PersonalNotifications.html` separates the cached personal notifications by priority. Existing structured `type` and `sessionId` values provide in-memory SPA actions: response notices target the Availability editor, volunteer notices target My Assignments, and an unknown type falls back to Today. There is no read-state persistence, URL routing, new sheet, or expanded notification payload.


Subsequent views independently request availability or dashboard data. Spreadsheet `Date` objects are converted to language-neutral strings before being returned to the browser. Date-only values use `YYYY-MM-DD`, time-only values use `HH:mm`, and date-time values include the `Asia/Tokyo` offset. The browser formats these values for `ja-JP` or `en-GB` when rendering.

## Availability save flow

1. The availability view calls `getAvailabilityPageData()`.
2. The server authenticates the current member.
3. It obtains active, non-cancelled sessions within `CONFIG.UPCOMING_WEEKS`.
4. It reads availability rows and attaches matching responses using `Member ID` or normalized email.
5. The browser sorts No response first, then `Unsure`, then answered sessions, while preserving chronological order within each group.
6. A compact list can be filtered by response need or session type; selecting a session opens one focused editor with radio options and an optional note.
7. On save, the browser sends only `sessionId`, `response`, and `reason` to `saveAvailability()`.
8. The server derives identity again, validates the input object, session ID, allowed response, and 500-character limit.
9. `getEditableSession_()` requires an active, non-cancelled session dated today or later and enforces a configured response deadline.
10. A script lock protects the read/modify/write operation.
11. The first matching row is replaced, preserving its original `Submitted At`; otherwise a row is appended.
12. The server returns the saved values and a machine-readable update timestamp with the `Asia/Tokyo` offset.
13. The browser updates local list state, returns to the list, and refreshes cached portal notifications in the background.


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

Visitor-schedule management does not replace or duplicate this same-day aggregation. New and updated Volunteer Assignment rows are consumed automatically by `buildTodaySessionData_()` when the dashboard reloads.

## Dashboard flow

1. The `today` route selects the operational Today renderer for Club Leaders and Teachers. The `planning` route independently selects the Upcoming Activities renderer; there are no internal Dashboard tabs.
2. `getDashboardData()` calls `requireDashboardAccess_()`.
3. `getTodaySessions_()` returns active, non-cancelled sessions matching today's date, sorted by start time.
4. The first session is passed to `buildTodaySessionData_()`.
5. The browser renders a session selector when multiple sessions exist.
6. It displays conflicts and missing expected attendance first, followed by action totals, visitor assignments, availability and attendance groups, and a read-only attendance count.
7. Selecting or refreshing a session calls `getDashboardSession(sessionId)`, which repeats server-side dashboard authorization and calls the same aggregation function.

`getDashboardSession()` validates the supplied ID against the active, non-cancelled sessions returned for today before building dashboard data.

Attendance is read-only in the current dashboard. Manual and QR attendance operations are not implemented.

## Upcoming Activities flow

Upcoming Activities is a separate management Planning route. Today remains the default management route and continues to use the existing Today APIs and aggregation.

1. `getUpcomingActivities(filters)` requires `canViewAllAvailability`.
2. The server validates machine-readable date filters and an optional exact English Session Type.
3. It selects active `Regular` and `Event` sessions after today. An empty request defaults to tomorrow through the existing eight-week configuration.
4. Active Students and Club Leaders come from `getActiveAttendingMembers_()`; inactive members and Teachers are excluded consistently with Today.
5. Availability and Volunteer Assignment rows are loaded once and indexed by Session ID.
6. Each session receives `Available`, `Unavailable`, `Unsure`, No response, assigned visitor, and conflict counts, plus the existing machine-readable response deadline from the shared session mapper.
7. No response means there is no matching Availability row for the member and session.
8. Cancelled and Declined Volunteer Assignments are ignored through the existing assignment-status helper.
9. The browser may filter those summaries to activities needing attention, defined as missing responses, assignment conflicts, or a response deadline within the next 72 hours.
10. Selecting a session calls `getUpcomingActivityDetail(sessionId)`, which repeats permission and session validation before returning grouped member details. Wide layouts use master-detail; narrower layouts use a focused detail state with an explicit Back action.

The detail payload contains Member ID, name, grade, role, response, private availability Reason, and current visitor-assignment details. It excludes member email and all Attendance data. Availability groups include every matching member regardless of assignment; visitor and conflict groups intentionally overlap the response groups. A conflict uses the same definition as Today: an active visitor assignment combined with `Unavailable`.

## Sessions and Events management flow

The Teacher-only `SessionManagement.html` view is separate from the operational Today dashboard. It uses the shared responsive management layout, lists Sessions rows, applies browser-side title, date, type, and status filters, and uses the shared localisation and date-formatting helpers. Desktop shows list and detail/editor together; narrower layouts use a focused detail/editor state.

`ManageSessions.gs` owns session-management business logic. Creates and updates validate the complete form on the server. Session types remain the English values `Regular`, `Event`, and `Cancelled`. End time cannot precede start time. A response deadline after the session begins requires an explicit confirmation flag that the server verifies.

Creates generate readable IDs while holding a script lock. A two-digit suffix is added when the date and type base already exists. Create and update request IDs are cached under the authenticated Teacher while locked to prevent repeated submissions.

Cancellation preserves the Sessions row, changes `Session Type` to `Cancelled`, and sets `Active` to false. Permanent deletion runs under a script lock and counts matching Session IDs in Availability, Volunteer Assignments, and Attendance immediately before deletion. If linked rows exist, deletion returns their counts and the frontend offers cancellation instead.

## Member management flow

The Teacher-only `MemberManagement.html` view is separate from the operational Today dashboard. It uses the shared responsive management layout, lists active and inactive Members rows, and filters them in the browser by name/email search, active status, role, and grade. Join and Leave dates are returned as `YYYY-MM-DD` values and formatted through the shared browser date helper.

`ManageMembers.gs` owns member-management business logic. Every public read and write first requires an active Teacher. Creates and updates validate the complete form again on the server, normalize emails to lowercase, enforce unique email addresses, preserve exact English role values, and reject a Leave Date earlier than the Join Date. Inactive records without a Leave Date require an explicit warning confirmation when saved through the full edit form.

Creates generate the next `M001`-style Member ID while holding a script lock. All mutations use the same lock and request-ID cache protection. Updates retain the existing Member ID and preserve any unrecognized extra sheet columns.

Deactivation is the normal removal path and requires a selected Leave Date; activation clears the previous Leave Date. A Teacher cannot remove the final active Teacher account. If a Teacher changes their own email, changes their own role away from `Teacher`, deactivates themselves, or deletes their own row, the server requires their current signed-in email as strong confirmation.

Permanent deletion is a separate action. While holding the lock, the server counts Availability, Volunteer Assignment, and Attendance rows matching either the Member ID or normalized student email. Any match blocks deletion and the frontend offers deactivation instead.

## Visitor Schedule management flow

“Visitor Schedule” is the user-facing name for rows in `Volunteer Assignments`. The `Volunteer.html` view calls `getMyVolunteerAssignments()`, which derives the signed-in member's Member ID and email and filters rows before mapping them for the browser. Its payload contains assignment and session display fields only; it never includes another member's assignment, member identity, availability, attendance, or private availability note.

Teachers and Club Leaders are routed to `VisitorScheduleManagement.html`. It uses the shared responsive management layout with a session-centric summary, assignment filters, a multi-member create editor, and a single-assignment detail/editor. `getVisitorScheduleManagementData()` requires `canManageVolunteers` and returns active upcoming sessions, active eligible Students and Club Leaders, assignment rows, and availability status. The limited manager member payload contains Member ID, name, grade, role, and availability response; it excludes member email and availability Reason.

Creates may assign multiple eligible members in one locked write. Creates and updates validate the active upcoming session, active eligible member, approved English assignment status, `HH:mm` departure time, and the composite Session ID/Member ID uniqueness. When a member is `Unavailable`, the server returns a confirmation-required result unless the manager explicitly resubmits with the override. `Unsure` and missing responses are returned as notices without blocking the save.

The departure time may precede the nominal session start because travel can begin earlier, but it cannot be later than a valid session End Time. Assignment statuses remain `Assigned`, `Confirmed`, `Declined`, and `Cancelled` in the sheet.

Cancellation changes only `Assignment Status` to `Cancelled`. Permanent deletion is allowed only for a future assignment whose session exists and that has no matching Attendance row. Today's, historical, orphaned-session, and attendance-linked assignments must be cancelled. No visitor-schedule operation writes to Attendance.

## Localisation approach

English is the canonical source language. `Localization.html` contains one `TRANSLATIONS` dictionary with English and Japanese catalogues and a `t()` interpolation helper used by client-rendered labels and messages. Japanese is selected by default. Responsive shell locations may render more than one language selector, but they all use the same `activeLocale`, dictionary, change handler, and `localStorage` preference. A language change rebuilds the shell and current permitted route while retaining Availability drafts. Shared browser helpers format machine-readable dates as `ja-JP` or `en-GB` using `Asia/Tokyo`. Server-generated errors and spreadsheet-derived fallback notification text remain raw English or spreadsheet-derived data.

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
| `getUpcomingActivities(filters)` | Yes | Requires club-wide availability access and returns active future session summaries |
| `getUpcomingActivityDetail(sessionId)` | Yes | Requires club-wide availability access and returns one active future session's grouped details |
| `getSessionManagementData()` | Yes | Requires Teacher access and returns Sessions rows for management |
| `createSession(submission)` | Yes | Requires Teacher access; validates and creates a locked, server-ID session |
| `updateSession(submission)` | Yes | Requires Teacher access; validates and updates one unique Session ID under lock |
| `cancelSession(sessionId)` | Yes | Requires Teacher access and marks the session Cancelled/inactive under lock |
| `deleteSession(sessionId)` | Yes | Requires Teacher access and deletes only after linked-record checks under lock |
| `getMemberManagementData()` | Yes | Requires Teacher access and returns the complete Members administration dataset |
| `createMember(submission)` | Yes | Requires Teacher access; validates and creates a locked, server-ID member |
| `updateMember(submission)` | Yes | Requires Teacher access; validates and updates one unique Member ID under lock |
| `setMemberActiveStatus(submission)` | Yes | Requires Teacher access; activates or deactivates a member under lock |
| `deleteMember(submission)` | Yes | Requires Teacher access and deletes only after Teacher and linked-record protections |
| `getMyVolunteerAssignments()` | Yes | Authenticates an active member and returns only that member's assignments |
| `getVisitorScheduleManagementData()` | Yes | Requires Club Leader or Teacher volunteer-management access |
| `createVolunteerAssignments(submission)` | Yes | Requires volunteer-management access; creates one or more locked, validated assignments |
| `updateVolunteerAssignment(submission)` | Yes | Requires volunteer-management access; updates one composite-key assignment under lock |
| `cancelVolunteerAssignment(submission)` | Yes | Requires volunteer-management access and marks one assignment Cancelled under lock |
| `deleteVolunteerAssignment(submission)` | Yes | Requires volunteer-management access and deletes only a safe future assignment |

`doGet()` is the public HTTP entry point but is not called through `google.script.run`.

Functions ending in `_` are internal by convention and are not called by the frontend.

## Security boundaries

Current server-enforced boundaries include:

- identity comes from `Session.getActiveUser()`, not client input;
- the account must match an active `Members` row;
- availability reads and writes are scoped to the authenticated member;
- dashboard APIs repeat authorization on the server;
- both Upcoming Activities APIs require `canViewAllAvailability` before reading or returning club-wide data;
- future list payloads contain counts only, while detail payloads omit member email and Attendance data;
- availability input is validated server-side;
- availability writes use `LockService`;
- every session-management read and write repeats Teacher authorization server-side;
- session creates, updates, cancellations, and deletions use `LockService`;
- permanent deletion is blocked while linked Availability, Volunteer Assignment, or Attendance rows exist;
- every member-management read and write repeats Teacher authorization server-side;
- member-management writes use `LockService`, enforce unique normalized email addresses, and retain server-owned Member IDs;
- the final active Teacher cannot be deactivated, demoted, or deleted, and self-access removal requires signed-in-email confirmation;
- permanent member deletion is blocked while linked Availability, Volunteer Assignment, or Attendance rows match the Member ID or email;
- personal volunteer reads are filtered to the authenticated member before client mapping;
- every visitor-schedule management read and write requires Club Leader or Teacher volunteer-management permission;
- the manager payload excludes availability Reason, member email, and attendance detail;
- Volunteer Assignment writes use `LockService`, exact English statuses, and composite-key duplicate checks;
- attendance-linked, current, and historical assignments cannot be permanently deleted, and visitor-schedule operations never alter Attendance;
- spreadsheet-derived text is normally escaped before insertion into generated HTML;
- spreadsheet and script identifiers are not sent to the client by current code.

Required boundaries from `AGENTS.md` include keeping the database spreadsheet inaccessible to students and never returning other students' private notes, attendance, or personal data to student clients. The current personal availability endpoint follows that rule. Dashboard payloads contain club-wide private and attendance data, but the dashboard functions enforce Club Leader or Teacher access.

When both the current member and a related row have `Member ID`, matching requires those IDs to agree. Email is used only when a row lacks a member ID, reducing the chance that malformed rows disclose data to the wrong member.

Remaining risks include deployment-dependent email visibility, absence of a domain restriction, lack of uniqueness constraints, and ambiguous date boundaries when script and spreadsheet time zones differ. Direct spreadsheet permissions and actual web-app deployment settings are outside the repository and cannot be verified here.
