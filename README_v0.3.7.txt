Bandito Taxito v0.3.7 - Multi-image Receipt Proof

What changed
- Receipt upload now accepts multiple selected photos/PDFs for one receipt.
- AI Capture sends selected receipt photos together as one read request.
- The AI prompt now treats a detailed invoice plus credit-card receipt as one transaction and avoids double-counting totals.
- Saved receipt proof files are stored together in the existing File URL cell, one Drive link per line.
- GitHub Code.gs was refreshed from the newer receipt-reader backend baseline before applying this patch.

What did not change yet
- No new spreadsheet headers were added.
- PDFs are saved as proof, but AI reading is still image-only.
- The mobile UI does not yet have a separate "add another photo" camera flow.
- Historic receipt long-press still starts from the header only; full expanded-card long-press is on the repair list.

Deploy comments
- Frontend: GitHub Pages will update from index.html on main.
- Backend: This update includes Code.gs changes. Replace the Apps Script Code.gs with this v0.3.7 file, save it, then deploy a new web app version using the existing deployment URL.
- Keep the existing GAS web app URL in index.html unless you intentionally create a new deployment.

Test checklist
1. Open Add Receipt.
2. Select two receipt proof images together, such as a detailed invoice and card slip.
3. Confirm AI Capture starts and fills one form.
4. Confirm/edit fields, then Confirm & Save.
5. In the Receipts sheet, verify one receipt row was created.
6. Verify File URL contains two Drive links, one per line.
7. Open Logbook and confirm the receipt can still be edited historically.
