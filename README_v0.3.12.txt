Bandito Taxito v0.3.12 - Feedback email alerts

Scope
- Backend-only feedback notification update.
- No frontend UI changes.
- No report, receipt AI, offline queue, save-flow, or appsscript.json changes.

Changed
- Updated backend APP.version to v0.3.12.
- Added feedback alert recipient: wrsorensen@gmail.com.
- After feedback is saved to the Feedback tab, Bandito sends a plain-text email alert.
- Email includes feedback ID, timestamp, type, message, optional contact, app version, sync source, page URL, and user agent.
- Email failures are audited but do not block the feedback row from being saved.

Files
- Code.gs
- README_v0.3.12.txt

Deploy Notes
- GitHub commit: v0.3.12 - Feedback email alerts
- GAS deploy comment: v0.3.12 - Feedback email alerts
- This may require Apps Script mail authorization before email delivery works.

Post-Deploy Checklist
1. Open the live app.
2. Confirm Settings/About still shows v0.3.11 because frontend did not change in this build.
3. Open Settings.
4. Open "Is Bandito missing something?"
5. Submit a test suggestion.
6. Confirm the row appears in the Feedback tab.
7. Confirm wrsorensen@gmail.com receives the email alert.
8. Confirm Audit Log has SAVE_FEEDBACK.
9. Confirm Audit Log has SEND_FEEDBACK_EMAIL or SEND_FEEDBACK_EMAIL_FAILED.
10. If email does not arrive, open Apps Script once and approve the new MailApp permission.
11. Confirm existing receipt/mileage/work save still works.
12. Confirm offline feedback queue still saves to Feedback after sync.

Version
- v0.3.12 - Feedback email alerts
