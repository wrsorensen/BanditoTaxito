Bandito Taxito v0.3.9 - Desktop UI polish

What changed
- Frontend-only desktop layout polish in index.html.
- Wider desktop app shell to reduce dead side space.
- Desktop header/logo balance improved.
- Settings and Logbook shortcuts sit as a desktop shortcut cluster.
- Logbook shortcut icon now renders inline like the Settings shortcut.
- Dashboard uses a desktop two-column layout.
- Quick action cards have more usable desktop size.
- Work Session and Bandito Review use the right column instead of stacking below the main actions.
- UI_VERSION updated to v0.3.9.

What did not change
- No Code.gs changes.
- No appsscript.json changes.
- No GAS URL changes.
- No save flow changes.
- No reports logic changes.
- No receipt AI changes.
- No offline queue changes.
- No backend behavior changes.
- Mobile base layout was left untouched; changes are under the desktop min-width media query.

Deploy comments
- Deploy/update the frontend index.html only.
- Keep the existing GAS web app URL.
- No Apps Script deployment is required for this desktop-only UI update.

Commit note
- v0.3.9 - Desktop UI polish

Test checklist
1. Desktop: open the dashboard around 1024px and 1440px wide.
2. Confirm the header/logo is balanced and shortcuts are top-right.
3. Confirm quick actions use the left column.
4. Confirm Work Session and Bandito Review use the right column.
5. Mobile: open around 390px wide and confirm the dashboard still matches the previous stacked phone layout.
