Bandito Taxito v0.3.6 - Receipt Client/Site Assist

Changed files:
- index.html

Backend:
- No Code.gs change.
- No appsscript.json change.
- No Sheet/header change.
- Keep the existing GAS deployment and URL.

What changed:
- Settings/About frontend version updates to v0.3.6.
- Add Receipt now pre-fills Client/Site from the active work session when one exists.
- If no active work session exists, Add Receipt uses the last saved receipt Client/Site on that device.
- User can still edit or clear Client/Site before saving.
- Receipt Client/Site memory is local-device only for now.

Install:
1. Replace GitHub root index.html with the v0.3.6 index.html.
2. Commit the GitHub change.
3. Do not replace Code.gs for this update.
4. Do not redeploy Apps Script for this update.
5. Open the app with:
   https://wrsorensen.github.io/BanditoTaxito/?v=036

Deploy comments:
GitHub commit:
v0.3.6 - Add receipt Client/Site assist

Release note:
v0.3.6 - Receipt Client/Site Assist

Frontend-only update. Add Receipt now defaults Client/Site from an active work session, or from the last saved receipt Client/Site when no active session exists. Users can still edit or clear the fields before saving.

No Code.gs change. No Apps Script redeploy. No Sheet/header change.

Test checklist:
1. Settings/About shows frontend v0.3.6.
2. Start Work with a Client and Site.
3. Return Home.
4. Open Add Receipt.
5. Receipt Client/Site should match the active work session.
6. Edit or clear Client/Site and confirm the fields remain editable.
7. Save a receipt with a different Client/Site.
8. Clear/end active session or use a browser with no active session.
9. Open Add Receipt again.
10. Receipt Client/Site should use the last saved receipt Client/Site.
11. AI Capture still auto-runs after choosing a photo.
12. Manual mode still skips AI.

Not included yet:
- Multi-image receipt proof.
- Business Use / Mixed / Split fields.
- Multi-user settings storage.
- Sheet/header changes.
- Backend CPA Review rules.
- CPA Packet output.
