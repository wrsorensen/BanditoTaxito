Bandito Taxito v0.2.1 — Logbook Viewer

Changed files only:
- Code.gs
- index.html
- README.txt

What changed:
- Adds read-only Logbook screen to the GitHub frontend.
- Adds API action `logbook` / `getLogbook` to GAS backend.
- Shows recent Work Logs, Mileage, Receipts, and Notes/Photos from the Sheet.
- Keeps records read-only; no edit/delete workflow yet.
- Does not change billable-day/pay calculations.
- Does not change Sheet headers.
- Does not change assets/docs/releases/appsscript.json.

Upload to GitHub root:
- Replace Code.gs
- Replace index.html

Apps Script:
- Replace Code.gs only.
- Deploy new Web App version.

Deploy note:
v0.2.1 — Logbook viewer

Test:
1. Open https://wrsorensen.github.io/BanditoTaxito/
2. Confirm Backend OK.
3. Tap View Logbook.
4. Confirm recent Work Log test appears.
5. Optional: add another Start/End Work record, then refresh Logbook.
