BANDITO TAXITO v0.3.3 — EXPANDED RECEIPT FINANCIAL FIELDS

CHANGED FILES
- index.html
- Code.gs

INSTALL ORDER
1. In Google Apps Script, replace Code.gs with the included Code.gs.
2. Save the Apps Script project.
3. Deploy > Manage deployments > Edit.
4. Choose New version and keep the existing web app deployment and GAS URL.
5. In GitHub repo wrsorensen/BanditoTaxito, replace the root index.html.
6. Commit the GitHub change.
7. Hard refresh the live app with ?v=033.

APPS SCRIPT DEPLOY DESCRIPTION
v0.3.3 — Expand receipt financial fields and simplify payment tracking

GITHUB COMMIT MESSAGE
v0.3.3 — Expand AI receipt financial fields

WHAT CHANGED
- Frontend UI_VERSION and backend APP.version are v0.3.3.
- Receipt form now tracks Vendor / Shop Name, Receipt / Invoice Date, Receipt / Invoice Number, Subtotal, Sales Tax, Total Amount, Payment Method, and optional Card Last 4.
- Payment Method options are Unknown, Card, Cash, Check, Bank / ACH, and Other.
- Paid By was removed from the receipt screen because Bandito Taxito is a personal 1099 tracker.
- Reimbursable remains available.
- Existing File URL continues storing the receipt/invoice Drive link.
- Gemini draft extraction now suggests the expanded financial fields.
- Confirmed values remain draft-only until the user applies, reviews, and explicitly saves.
- Receipt Logbook details display the new fields. Edit/delete control behavior was not changed.

SAFE SHEET UPGRADE
The backend appends these headers to the Receipts tab only when missing:
- Receipt / Invoice Number
- Subtotal
- Sales Tax
- Payment Method
- Card Last 4

Existing columns are not reordered and existing rows are not rewritten.
The legacy Paid By column remains in the Sheet for backward compatibility, but new v0.3.3 records leave it blank.
No new column is added for the file link; the existing File URL column is preserved.

NOT INCLUDED
- Multi-image receipt packets
- PDF AI extraction
- Changes to appsscript.json, GAS URL, Firebase/Auth, pay, mileage, tax calculations, offline queue, dashboard customization, or Logbook edit/delete behavior

FIRST TEST
1. Use one clear JPG receipt.
2. Generate AI Draft.
3. Confirm vendor/date/invoice number/subtotal/tax/total/payment method/card last four where shown.
4. Apply the draft, edit fields, and Confirm & Save.
5. Verify one Sheet row, the new columns, AI Status, and File URL.
6. Test a manual receipt without AI.
