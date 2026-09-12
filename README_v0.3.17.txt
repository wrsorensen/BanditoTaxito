Bandito Taxito v0.3.17 - Reimbursement Print Cleanup

Scope
- Frontend-only cleanup for the Company Expense / Reimbursement report print view.
- No backend, GAS URL, save flow, receipt AI, offline queue, or report data logic changed.

Changed
- Print/PDF output hides report setup controls so the report starts with its title.
- Company Expense / Reimbursement report dates display as mm/dd/yyyy.
- Replaced broken close-button encoding glyphs with a plain X.
- Updated frontend UI_VERSION to v0.3.17.

Files
- index.html
- README_v0.3.17.txt

Deploy Notes
- GitHub commit: v0.3.17 - Reimbursement print cleanup
- GitHub Pages deploy after pushing main.
- No GAS deployment needed.

Post-Deploy Checklist
1. Confirm About shows v0.3.17.
2. Open Company Expense / Reimbursement report.
3. Preview a report titled TxDOT: 2026 MNT Conference.
4. Print / Save PDF and confirm setup controls are hidden.
5. Confirm the report starts with the title and dates show as mm/dd/yyyy.
6. Confirm receipt proof links remain clickable.
7. Confirm CPA / Tax Prep report still previews.
8. Open Settings and Logbook edit controls and confirm the top-right close buttons show X.
9. Check desktop and mobile layouts.

Version
- v0.3.17 - Reimbursement Print Cleanup