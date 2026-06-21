# Authoring dossiers (you only edit here)

Copy `_template/` to a new folder named **`{episode}-{slug}`**:

```text
content/12-trip-com-exposed/
  article.md      ← your investigation write-up (markdown)
  evidence.json   ← links, PDFs, images
  meta.json       ← optional title/subtitle overrides
```

**Episode number** = position in the podcast feed (newest = 1). Open the app and check the `EP. XX` pill, or run `node scripts/build.mjs` — it prints RSS mappings.

**Do not edit** `dossiers/` or `manifest.json` by hand. GitHub Actions rebuilds them when you push changes here.

### Draft mode

Set `"draft": true` in `meta.json` to keep working without showing the DOSSIER badge in the app.

### Push

```powershell
git add content/12-my-slug/
git commit -m "Add dossier: my-slug"
git push
```

The workflow fetches Spotify/Anchor RSS, wires GUIDs, and publishes to GitHub Pages automatically.