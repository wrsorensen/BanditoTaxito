Bandito Taxito v0.3.13 - Feedback email auth helper

Scope
- Small fix build for feedback email authorization and visible version sync.
- No Settings UX reorg.
- No Logbook UX reorg.
- No save-flow, report, receipt AI, offline queue, or appsscript.json changes.

Changed
- Updated frontend UI_VERSION to v0.3.13.
- Updated backend APP.version to v0.3.13.
- Added Apps Script run-menu helper: testFeedbackEmailAuth().
- testFeedbackEmailAuth sends a plain-text test email to wrsorensen@gmail.com.
- testFeedbackEmailAuth logs TEST_FEEDBACK_EMAIL_AUTH after a successful send.

Files
- Code.gs
- index.html
- README_v0.3.13.txt

Deploy Notes
- GitHub commit: v0.3.13 - Feedback email auth helper
- GAS deploy comment: v0.3.13 - Feedback email auth helper
- After deployment, open Apps Script, select testFeedbackEmailAuth, click Run, and approve mail permission.

Post-Deploy Checklist
1. Open Apps Script.
2. Refresh the Apps Script editor tab.
3. Select testFeedbackEmailAuth from the function dropdown.
4. Click Run.
5. Approve the requested mail permission.
6. Confirm wrsorensen@gmail.com receives the test email.
7. Confirm Audit Log shows TEST_FEEDBACK_EMAIL_AUTH.
8. Open the live app.
9. Confirm Settings/About shows v0.3.13.
10. Submit a feedback test from the live app.
11. Confirm the Feedback tab gets the row.
12. Confirm wrsorensen@gmail.com receives the real feedback alert.
13. Confirm Audit Log shows SAVE_FEEDBACK and SEND_FEEDBACK_EMAIL.

Planned Later
- Reorganize/re-UX Settings.
- Reorganize/re-UX Logbook setup.

Version
- v0.3.13 - Feedback email auth helper
