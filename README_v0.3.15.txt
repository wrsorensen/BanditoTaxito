Bandito Taxito v0.3.15 - Company Expense / Reimbursement Report

Scope
- Frontend-only reporting addition for employer/company reimbursement use.
- The existing CPA / Tax Prep report remains unchanged.
- No backend, GAS URL, appsscript.json, save-flow, receipt AI, offline queue, or schema changes.

Changed
- Added Report Type choice: CPA / Tax Prep or Company Expense / Reimbursement.
- Added an optional company/trip title for the expense report.
- Added optional Client and Site / Trip matching fields.
- Added reimbursement-status and receipt-proof filters.
- Added itemized company expense table with date, vendor, category, client/site, notes, amount, status, and receipt proof links.
- Added summary totals for expenses, included receipts, receipt links, and missing proof.
- Supports multiple receipt proof links when a receipt has more than one uploaded file.
- Updated frontend UI_VERSION to v0.3.15.

Files
- index.html
- README_v0.3.15.txt

Deploy Notes
- GitHub commit: v0.3.15 - Company expense reimbursement report
- GitHub Pages deploy only. No Google Apps Script deployment is needed.

Post-Deploy Checklist
1. Open the live app and confirm About shows v0.3.15.
2. Open Reports and confirm both report types are available.
3. Switch to Company Expense / Reimbursement and confirm the CPA bucket options disappear.
4. Choose a date range and preview the company expense report.
5. Confirm the itemized table has the correct date, vendor, category, client/site, notes, amount, and status.
6. Open a receipt proof link and confirm the upload opens.
7. Test Yes only, proof filters, and an optional client/site match.
8. Print / Save PDF and confirm the table and receipt links are readable.
9. Switch back to CPA / Tax Prep and confirm its report preview still works.
10. Check Reports on mobile and confirm controls and the table remain usable.

Version
- v0.3.15 - Company Expense / Reimbursement Report
