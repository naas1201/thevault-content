# The Vault — Dossier Content (GitHub Pages)

Remote investigation pages for **The Vault** podcast app. Each episode can have an article + evidence pack, loaded by the app without a Play Store update.

## What lives here

| Path | Purpose |
|------|---------|
| `manifest.json` | Index: which RSS episodes have a dossier |
| `dossiers/*.json` | Full micro-blog content per episode |
| `.nojekyll` | Tells GitHub Pages to serve raw JSON (required) |

## GitHub Pages setup (one-time)

### 1. Create the GitHub repo

1. Go to [github.com/new](https://github.com/new)
2. Repository name: **`thevault-content`** (recommended)
3. Public repo
4. Do **not** add README/license (this folder already has one)
5. Create repository

### 2. Push this folder

From PowerShell, inside `vault-content/`:

```powershell
git init
git add .
git commit -m "Initial dossier CDN for The Vault app"
git branch -M main
git remote add origin https://github.com/naas1201/thevault-content.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **`main`** / folder **`/ (root)`**
4. Save

After 1–3 minutes your base URL is:

```text
https://naas1201.github.io/thevault-content/
```

### 4. Verify (open in browser)

- `https://naas1201.github.io/thevault-content/manifest.json`
- `https://naas1201.github.io/thevault-content/dossiers/french-public-neutrality.json`

Both must return JSON (not 404).

### 5. Replace placeholders

Search/replace **`naas1201`** in:

- `manifest.json` → `contentBaseUrl`
- `APP_CONFIG.snippet.json` (for the Android app later)

Commit and push again.

## Add a new episode dossier

1. Create `dossiers/my-new-slug.json` (copy an existing file as template)
2. Add to `manifest.json` → `episodes`:

```json
"RSS_GUID_FROM_ANCHOR": {
  "slug": "my-new-slug",
  "hasDossier": true
}
```

Or use episode number shorthand:

```json
"ep:12": {
  "slug": "my-new-slug",
  "hasDossier": true
}
```

3. Bump `updatedAt` in manifest
4. `git add . && git commit -m "Add dossier: my-new-slug" && git push`

The app will pick it up on next refresh (once integrated).

## Episode IDs for The Vault (Anchor RSS)

| # | GUID | Suggested slug |
|---|------|----------------|
| 1 | `b493574f-c0d6-47ea-8353-b3a743043f0b` | france-media-shell-game |
| 2 | `96ff1e45-1672-4570-b6c4-2fb6b5b76cab` | french-public-neutrality ✓ |
| 3 | `0dfe1ac1-e6eb-4af8-8b6a-08d76df59f70` | host-producer-grift ✓ |
| 11 | `f9435c4a-f9c1-438e-b574-f681e89cd3b8` | visa-mafia ✓ |

✓ = sample dossier included in this repo

## Dossier JSON schema

```json
{
  "version": 1,
  "slug": "kebab-case-id",
  "title": "Episode title",
  "subtitle": "One-line hook",
  "publishedAt": "YYYY-MM-DD",
  "article": {
    "format": "markdown",
    "body": "## Heading\n\nMarkdown text..."
  },
  "evidence": [
    {
      "id": "unique-id",
      "type": "document|image|link|video|audio",
      "title": "Label",
      "description": "Optional context",
      "url": "https://...",
      "thumbnail": "https://...",
      "source": "Optional source name",
      "date": "YYYY-MM-DD",
      "tags": ["primary-source"]
    }
  ]
}
```

## App integration (next step)

After Pages is live, add to `app/src/main/assets/config.json`:

```json
"contentManifestUrl": "https://naas1201.github.io/thevault-content/manifest.json",
"contentBaseUrl": "https://naas1201.github.io/thevault-content/dossiers/"
```

The Android app implementation will be done in a follow-up step.

## License

Investigation content © you. JSON structure is part of The Vault project.