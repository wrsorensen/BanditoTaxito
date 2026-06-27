# Deploy Notes

## Live deployment target

Google Apps Script web app.

GitHub is source control only right now.

## Current deploy comment

```text
v0.1.2 — Bandito Taxito cosmetic polish
```

## Manual deploy steps

1. Open the Apps Script project.
2. Replace `Code.gs` with repo `Code.gs`.
3. Replace `Index.html` with repo `Index.html`.
4. Save.
5. Deploy > Manage deployments.
6. Edit current web app deployment or create a new version.
7. Use the deploy comment above.
8. Keep access private / only you until testing passes.

## Post-deploy inspection checklist

1. Header says Bandito Taxito.
2. No subtitle appears under the title.
3. No visible blue theme remains.
4. Home cards look clean on phone.
5. Start/End Work still save.
6. Receipt upload still works.
7. Weekly Review still refreshes.
8. Offline queue still shows/syncs.

## Warning

Do not overwrite unrelated Apps Script files. This package only needs:

- Code.gs
- Index.html

`appsscript.json` is included for GitHub reference, but do not overwrite an existing Apps Script manifest unless needed.
