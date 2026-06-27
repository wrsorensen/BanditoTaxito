# Build Notes

## Current version

v0.1.2 — Bandito Taxito cosmetic polish

## Current build state

- Google Apps Script web app
- Google Sheets backend
- Mobile-first layout
- Desktop-capable companion use
- Private deployment only for now

## v0.1.2 changed

- Removed subtitle under title
- Header now shows Bandito Taxito only
- Removed visible blue theme
- Added warm Tex-Mex / outlaw palette
- Added Today card
- Added big icon action cards
- Added status badges/pills
- Added light Tex-Mex copy
- Kept functionality intact

## Current build pause

Do not build heavy backend logic until user gets answers about:

- W-2 vs 1099 vs LLC
- tax withholding
- pay structure
- mileage reimbursement
- receipt reimbursement
- company system / timesheet / invoice requirements

## Safe to keep improving now

- mobile UI polish
- app theme
- mascot assets
- simple nav
- empty states
- loading/success screens
- settings shell
- field wording

## Do not build yet

- hard-coded tax calculations
- S-corp logic
- payroll logic
- full bookkeeping
- invoice automation
- reimbursement automation
- AI receipt final save without confirmation

## Receipt AI plan

Future receipt flow:

1. Upload receipt photo.
2. AI/OCR reads vendor, date, total, tax, category, payment method if visible.
3. App opens confirmation popup.
4. Missing/unclear fields are highlighted.
5. User confirms.
6. App saves to Sheets.

Rule: AI can prefill. AI should not auto-save guesses.


## UX / build guardrail added

A locked app build style file was added at:

```text
/docs/app-build-style-ux-preferences.md
```

Use it before future feature work. Key direction: mobile-first, clean control-panel feel, practical over fancy, thumb-friendly controls, exportable data, documented business rules, and no backend/auth/data logic changes unless specifically requested.
