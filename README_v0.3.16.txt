Bandito Taxito v0.3.16 - Receipt Reimbursement Edit

Scope
- Fixes receipt editing so Reimbursable? can be changed from Logbook.
- No receipt files, receipt AI, reports, save flows, offline queue, or unrelated Logbook fields changed.

Changed
- Added a Reimbursable? dropdown to the receipt edit sheet with Unknown, Yes, and No.
- Prefills the current reimbursement status when editing a receipt.
- Sends the edited status through the existing Logbook update endpoint.
- Added the Reimbursable? field to the existing backend receipt update mapping.
- Updated frontend and backend version to v0.3.16.

Files
- Code.gs
- index.html
- README_v0.3.16.txt

Deploy Notes
- GitHub commit: v0.3.16 - Receipt reimbursement edit fix
- GitHub Pages deploy after pushing main.
- Google Apps Script: paste the updated Code.gs into the Bandito Taxito Apps Script project and deploy a new web-app version. Keep the existing deployment URL and settings.

Post-Deploy Checklist
1. Confirm About shows v0.3.16.
2. Open Logbook and filter Receipts.
3. Open a receipt row, tap the row action button, and choose Edit.
4. Confirm Reimbursable? appears and shows the current value.
5. Change it to Yes or No and save.
6. Refresh Logbook and confirm the new value remains.
7. Confirm the Feedback email workflow still works.
8. Confirm CPA and Company Expense reports still open.
9. Check the receipt edit sheet on mobile.

Version
- v0.3.16 - Receipt Reimbursement Edit