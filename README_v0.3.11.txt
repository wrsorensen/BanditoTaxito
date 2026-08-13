Bandito Taxito v0.3.11 - Settings feedback box

What changed
- Added Settings feedback item: "Is Bandito missing something?"
- Added feedback type choices: Bug, Suggestion, Missing Feature, Other.
- Added message field and optional contact field.
- Feedback automatically attaches UI version, page URL, and browser user agent.
- Added backend Feedback tab headers.
- Added saveFeedback API action and feedback save routing.
- Added offline queue support for feedback submissions.
- Updated frontend UI_VERSION to v0.3.11.
- Updated backend APP.version to v0.3.11.

What did not change
- No GAS URL changes.
- No reports logic changes.
- No receipt AI changes.
- No Logbook edit/delete behavior changes.
- No existing save flow behavior changed outside adding the new feedback type.

Deploy comments
- GitHub Pages must be updated with index.html.
- Apps Script must be updated with Code.gs for the new Feedback tab/API.
- Keep the existing GAS web app URL.
- GAS deploy comment: v0.3.11 - Settings feedback box.

Post-deploy checklist
1. Open live Bandito Taxito.
2. Confirm Settings/About shows v0.3.11.
3. Open Settings.
4. Tap "Is Bandito missing something?"
5. Confirm Bug / Suggestion / Missing Feature / Other options appear.
6. Try sending with no message and confirm it blocks the send.
7. Enter a test message and send.
8. Confirm the app shows feedback sent.
9. In the backend Sheet, confirm a Feedback tab exists.
10. Confirm the test row includes type, message, optional contact, app version, page URL, user agent, status.
11. Confirm existing save flows still work.
12. Confirm Bandito Review still opens.
13. Confirm mobile Settings panel remains usable.
14. Confirm desktop dashboard remains two-column at 1024px+.

Commit note
- v0.3.11 - Settings feedback box
