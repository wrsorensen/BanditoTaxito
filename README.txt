Bandito Taxito — Repo Support Restore v0.2.0

Use this ZipPak because the repo was cleaned too aggressively and support folders/files were removed.

This ZipPak restores:
- docs/
- releases/
- appsscript.json
- .gitignore
- README.txt instructions

It does NOT replace root Code.gs or root index.html.
Keep your current v0.2.0 root Code.gs and index.html from the architecture ZipPak.

Upload to GitHub repo root:
- docs/
- releases/
- appsscript.json
- .gitignore

After upload, root should look like:

assets/
docs/
releases/
Code.gs
index.html
appsscript.json
README.txt or README.md
.nojekyll if present

Do NOT add:
- Index.html

For v0.2.0:
- GitHub Pages uses index.html as the full branded frontend.
- Apps Script uses Code.gs as the backend/API.
- appsscript.json is only the Apps Script project manifest backup/source copy.
