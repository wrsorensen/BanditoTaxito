Bandito Taxito v0.3.14 - Settings and Logbook UX pass

Scope
- Frontend UX pass for Settings, Logbook, and desktop background.
- Backend version sync only.
- No CPA report changes.
- No save-flow, receipt AI, offline queue, schema, GAS URL, or appsscript.json changes.

Changed
- Updated frontend UI_VERSION to v0.3.14.
- Updated backend APP.version to v0.3.14.
- Reorganized Settings home into Daily Use, System, and Support groups.
- Added Logbook Setup settings for default Logbook view and compact rows.
- Added Logbook filter buttons: All, Work, Mileage, Receipts, Notes.
- Added Logbook count chips for recent record groups.
- Added visible row action button for Logbook edit/delete controls.
- Kept long-press Logbook actions as a fallback.
- Fixed visible Settings/Logbook encoding junk in touched controls.
- Added desktop-only background treatment so PC no longer uses the mobile parchment background.
- Preserved mobile background/UI behavior.

Files
- Code.gs
- index.html
- README_v0.3.14.txt

Deploy Notes
- GitHub commit: v0.3.14 - Settings and Logbook UX pass
- GAS deploy comment: v0.3.14 - Settings and Logbook UX pass

Post-Deploy Checklist
1. Open live app on desktop.
2. Confirm About shows v0.3.14.
3. Confirm desktop background is no longer the mobile parchment image.
4. Open Settings and confirm grouped sections: Daily Use, System, Support.
5. Open Logbook Setup.
6. Set default view to Receipts, save, reopen Logbook, and confirm Receipts is selected.
7. Turn Compact Rows on, save, and confirm Logbook rows are tighter.
8. Use Logbook filter buttons: All, Work, Mileage, Receipts, Notes.
9. Confirm Logbook count chips display.
10. Open a Logbook row and confirm details still expand.
11. Tap the row action button and confirm Edit/Delete controls open.
12. Confirm Bandito Review issue navigation still opens matching Logbook records.
13. Check mobile and confirm mobile background/UI still feels unchanged.
14. Submit one feedback item and confirm email still sends.

Planned Later
- Deeper Logbook search/filter expansion.
- Deeper Settings content cleanup as new app options are added.

Version
- v0.3.14 - Settings and Logbook UX pass
