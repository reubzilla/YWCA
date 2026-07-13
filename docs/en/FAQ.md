# FAQ

English is the canonical version of this guide.

## Access

### Why can I not open the portal?

Use the school Google Workspace account registered in the `Members` data. The email must match and the member must be active. Ask a Teacher to check the member record if access still fails.

### Why can I not see a management section?

Navigation follows the role in your active member record. Club Leaders can access Dashboard and Visitor Schedules. Only Teachers can access Sessions & Events and Members.

### Do Students need access to the Google Sheet?

No. Students should use only the web application and should not be given access to the database spreadsheet.

## Language and display

### Which language is used by default?

Japanese. English can be selected in the header, and the browser stores the preference locally.

### Why are some names or notes not translated?

Names, session titles, notes, activities, locations, and other entered content are intentionally preserved. Only interface labels and known internal values are translated for display.

### Which time zone does the portal use?

The application uses `Asia/Tokyo`. Dates display using Japanese conventions in Japanese and British English conventions in English.

## Availability

### Can I change an availability response?

Yes, while the session remains active, non-cancelled, and dated today or later. Saving again updates your existing matching response.

### Who can read my private availability note?

Authorised Club Leaders and Teachers can see it in management data. Other Students cannot.

### Does the response deadline prevent late saving?

Not currently. The deadline is displayed, but automatic enforcement is **Coming Soon**.

## Volunteer assignments

### Can Students see other members' assignments?

No. The personal Volunteer Schedule API derives identity from the signed-in account and returns only that member's assignments.

### What happens if an unavailable member is assigned?

A manager sees a warning and must explicitly confirm the assignment. `Unsure` and no response produce notices.

### Why can an assignment not be deleted?

Today's assignments, historical assignments, attendance-linked assignments, and assignments with a missing session must be cancelled rather than permanently deleted.

## Sessions and members

### Why can a session not be permanently deleted?

Any linked Availability, Volunteer Assignment, or Attendance record blocks deletion. Cancel the session instead.

### Why can a member not be permanently deleted?

Linked Availability, Volunteer Assignment, or Attendance history blocks deletion. Deactivate the member instead.

### Why can a Teacher not be deactivated or demoted?

The portal protects the final active Teacher account. It also requires strong confirmation when a Teacher would remove their own management access.

## Coming Soon

### Can Students check in through the portal?

Not yet. Student, QR-code, and same-day check-in are **Coming Soon**.

### Can managers record attendance?

Not yet. The Dashboard can read an attendance summary, but attendance editing is **Coming Soon**.

### Can Teachers manage Settings?

Not yet. Settings management is **Coming Soon**.
