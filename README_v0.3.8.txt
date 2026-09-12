Bandito Taxito v0.3.8 - CPA Report Builder

What changed
- Added a Reports dashboard button.
- Added CPA / Tax Prep Report Builder.
- User can choose date range and report buckets.
- Report buckets include Summary, Work / Income, Receipts / Expenses, Mileage, Vehicle, Reimbursements, CPA Review Flags, and Missing Info Checklist.
- Added Preview Report.
- Added Print / Save PDF using the browser print dialog.
- Added backend reportData action to read saved Sheet data for the selected date range.

What did not change
- No new Sheet headers.
- No new stored user fields.
- No Google Drive PDF export yet.
- No CPA packet file auto-generation yet.

Deploy comments
- GitHub is updated for the frontend.
- GAS must be updated with this v0.3.8 Code.gs before live reports can pull real Sheet data.
- Keep the existing GAS web app URL unless intentionally creating a new deployment.

Test checklist after GAS deploy
1. Open the live app.
2. Open Reports.
3. Confirm dates default to current tax year through today.
4. Keep default CPA buckets checked.
5. Tap Preview Report.
6. Confirm report renders real Sheet totals and rows.
7. Try Print / Save PDF.
8. Spot-check Receipts / Expenses, Mileage, Reimbursements, CPA Review Flags, and Missing Info.
