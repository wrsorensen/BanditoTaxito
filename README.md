# Bandito Taxito

Mobile-first Google Apps Script web app for consultant / 1099-style work tracking.

**Current version:** v0.1.2 — Bandito Taxito cosmetic polish

## Current purpose

Bandito Taxito is a rugged, mobile-first tracker for:

- work logs
- project/site notes
- mileage
- receipts
- photos/notes
- tax reminders
- weekly review

The live app is still deployed through **Google Apps Script**. GitHub is being used for clean source control and release snapshots.

## Important status

Backend/business logic is intentionally paused until pay/tax/LLC answers are confirmed.

Do **not** hard-code assumptions yet for:

- W-2 vs 1099 vs LLC
- day-rate vs hourly vs salary
- invoicing
- reimbursements
- tax set-aside math
- CPA export logic

## Repo structure

```text
/
├── Code.gs
├── Index.html
├── README.md
├── appsscript.json
├── docs/
│   ├── brand-theme.md
│   ├── initial-build-questions.md
│   ├── app-build-style-ux-preferences.md
│   ├── build-notes.md
│   └── deploy-notes.md
└── releases/
    └── v0.1.2/
        ├── Code.gs
        ├── Index.html
        └── README.md
```


## Build style / UX guardrail

Follow `docs/app-build-style-ux-preferences.md` before adding features.

Core rule: mobile-first control panel, not a cramped desktop form. Keep tax/financial data sensitive and keep backend/auth/data logic unchanged unless specifically requested.

## Apps Script deploy workflow

1. Open the Google Apps Script project.
2. Copy `Code.gs` into the Apps Script `Code.gs` file.
3. Copy `Index.html` into the Apps Script `Index.html` file.
4. Do not overwrite unrelated Apps Script files.
5. Deploy new version as a web app.
6. Use this deploy comment:

```text
v0.1.2 — Bandito Taxito cosmetic polish
```

## Visibility

Current deployment should stay private / only visible to Will until the basic mobile flow is tested.

## Current known limits

- Real AI receipt extraction is not built yet.
- Invoicing/payment workflow is not built yet.
- GPS capture is not built yet.
- CPA/tax export packet is not built yet.
- Final LLC/pay/tax structure is not locked yet.

## Build rule

Functionality first, but do not build trash.

Mobile-first. Desktop-capable.
