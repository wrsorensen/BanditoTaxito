# App Build Style / UX Preferences

These are locked build preferences for Bandito Taxito and related tax / financial tracking app work.

## Overall style

- Mobile-first.
- Clean, bold, easy to read.
- Practical over fancy.
- Fast to use in real life.
- No tiny desktop layout squeezed onto a phone.
- No overbuilt enterprise mess unless absolutely needed.
- Dark / premium look is okay, but readability matters more than decoration.

## Mobile UX

- Design for a normal phone width first, around 390–430px.
- Body text should be readable, usually 15–16px minimum.
- Buttons and inputs should be thumb-friendly, usually 48–52px tall.
- Use clear spacing between sections.
- Avoid cramped side-by-side layouts on mobile.
- Stack cards vertically when needed.
- Bottom nav or tab nav should be easy to tap and easy to read.
- Do not try to fit everything above the fold.

## Screen layout

- Start with a simple dashboard / control-center feel.
- Show the most important numbers / actions first.
- Use cards for major sections.
- Use clear labels and plain language.
- Avoid clutter.
- Keep advanced details behind expand / collapse sections, drawers, or detail pages.
- Make the app feel like a tool that can actually be managed from a phone.

## Workflow preferences

- Give exact copy / paste code blocks.
- Use sniper edits when possible.
- Do not rewrite the whole app unless needed.
- Verify current source before making changes.
- Do not guess at existing code structure.
- Keep changes versioned.
- Give short test checklists after edits.
- Clearly say: GOOD TO COMMIT or DO NOT COMMIT YET.

## Data / logic preferences

- Keep data tables clean and exportable.
- Use plain column names.
- Keep business rules documented in plain English.
- Avoid burying important logic in weird formulas or hidden script behavior.
- Keep the app modular so pieces can be replaced later.
- Preserve future portability to CSV, XLSX, Microsoft Lists, Power BI-style data, or similar tools.

## Design tone

- The app should feel like a control panel, not a paperwork form.
- Clear status indicators are good.
- Use simple color meaning:
  - green = good / complete
  - orange or yellow = warning / needs review
  - red = problem / overdue / needs action
  - blue or gray = neutral / info
- Make important actions obvious.
- Make dangerous actions confirmed before running.

## Build guardrails

- Do not change backend / auth / data logic unless specifically requested.
- Do not expose private financial / tax data on public pages.
- Treat anything tax / financial as sensitive.
- Build the workflow first, but keep the plumbing replaceable.
- Ask if unclear instead of guessing.
