Bandito Taxito v0.2.0 — GitHub Frontend + GAS API Backend

Purpose:
- Switch the app to the same architecture style as your other builds.
- GitHub Pages is now the full branded frontend.
- Google Apps Script is now backend/API only.
- Google Sheets and Drive remain the data/storage layer.

Changed files in this ZipPak:
- index.html
- Code.gs
- .nojekyll
- README.txt

Do NOT upload an Index.html for this architecture.
The capital-I Apps Script HTML screen is no longer needed because Code.gs no longer serves the UI.

GitHub root should have:
- assets/
- docs/
- releases/
- Code.gs
- index.html
- appsscript.json
- README.txt or README.md
- .nojekyll

GitHub steps:
1. Replace root index.html with this ZipPak's index.html.
2. Replace root Code.gs with this ZipPak's Code.gs.
3. Upload .nojekyll if GitHub lets you.
4. Keep assets/ unchanged.
5. Commit.

Apps Script steps:
1. Open Apps Script.
2. Replace Code.gs only.
3. You can leave old Index.html there, but it is unused now.
4. Deploy > Manage deployments > Edit existing Web App deployment.
5. Select new version.
6. Keep URL the same.
7. Save/deploy.

Deploy comment:
v0.2.0 — GitHub frontend + GAS API backend

Live frontend:
https://wrsorensen.github.io/BanditoTaxito/

GAS backend:
https://script.google.com/macros/s/AKfycbyM4acSDZT7L6q_I7UQDfMc4xZiCFGXlw9B9pPPawGQSQtTCvtQZFNxbsAQ3z7vFBcPVQ/exec

Expected behavior:
- Opening GitHub Pages shows the full branded app.
- The app loads Settings/Clients/Weekly Review from GAS using JSONP.
- Saves are sent to GAS through a hidden POST form to avoid browser CORS blocking.
- The visible confirmation means the record was sent to the backend. Verify test rows in Google Sheet.

Test checklist:
1. Open GitHub Pages.
2. Header shows v0.2.0 GH.
3. Backend pill changes to Backend OK.
4. Start Work.
5. End Work and save.
6. Confirm row appears in Work Log.
7. Add Mileage and confirm row.
8. Add Receipt with a small test image and confirm row/file.
9. Refresh Weekly Review.

Rollback:
- Revert GitHub index.html to previous version.
- Revert Apps Script Code.gs to previous v0.1.2/v0.1.3 version.
