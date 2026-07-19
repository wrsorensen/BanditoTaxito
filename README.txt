Bandito Taxito v0.2.2 — Mobile / Dashboard Cleanup

REPLACE
- Replace the repository root index.html with the included index.html.

DO NOT TOUCH
- Code.gs
- appsscript.json
- assets/
- docs/
- releases/
- backend Sheet schema
- billable/pay logic

CHANGES
- Receipts and mileage are now the first dashboard actions.
- Quick tools are smaller and cleaner.
- Start Work and End Work stay on one mobile row.
- Logbook is available from the header.
- Weekly Review is more compact.
- Zero-count offline queue controls stay hidden.
- Removed the bulky Today/mascot copy card and extra dashboard clutter.
- Updated frontend version to v0.2.2.

TEST
1. Open the app on a phone-width screen.
2. Confirm Receipt, Mileage, Note/Photo, and Tax Helper open.
3. Confirm Start Work and End Work remain side-by-side.
4. Confirm Logbook opens from the header and loads records.
5. Confirm Weekly Review loads.
6. Confirm Start/End Work, receipt, mileage, and note saves still reach the backend.
7. Confirm no assets are missing.
