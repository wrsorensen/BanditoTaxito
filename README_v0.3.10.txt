Bandito Taxito v0.3.10 - Bandito Review issue navigation

What changed
- Frontend-only Bandito Review navigation in index.html.
- Review issue rows with open counts are now tappable/clickable.
- Tapping an issue loads recent Logbook records through the existing logbook API.
- One matching issue opens the affected record directly.
- Multiple matching issues show a filtered Logbook list.
- Filtered records show the exact reason they need attention.
- A Logbook filter banner shows the active Review issue and has a Clear button.
- UI_VERSION updated to v0.3.10.

What did not change
- No Code.gs changes.
- No appsscript.json changes.
- No GAS URL changes.
- No save flow changes.
- No reports logic changes.
- No receipt AI changes.
- No offline queue changes.
- No backend behavior changes.

Deploy comments
- Deploy/update the frontend index.html only.
- Keep the existing GAS web app URL.
- No Apps Script deployment is required for this frontend-only update.

Commit note
- v0.3.10 - Bandito Review issue navigation

Post-deploy checklist
1. Open live Bandito Taxito.
2. Confirm Settings/About shows v0.3.10.
3. Open Bandito Review.
4. With no logged data, confirm empty/clean Review state does not show clickable issue rows.
5. After test records exist, create or find one record with a missing end time.
6. Tap Missing end in Bandito Review.
7. Confirm one matching record opens directly in Logbook and shows "Needs attention: Missing end time."
8. Create or find multiple receipts missing proof files.
9. Tap Receipt file in Bandito Review.
10. Confirm Logbook shows only matching records and the filter banner explains the issue.
11. Tap Clear and confirm the full recent Logbook returns.
12. Confirm normal Logbook tap-to-open and hold-for-edit/delete still work.
13. Confirm mobile dashboard layout still matches v0.3.9.
14. Confirm desktop dashboard polish still appears at 1024px+.
