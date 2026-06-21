# Authoring dossiers

**All 19 episodes are pre-scaffolded** from the Spotify RSS feed. Open the folder for the EP number you want to fill in.

See **`EPISODES.md`** for the full index (folder name ↔ title ↔ draft/live status).

## Your job per episode

1. Open `content/XX-slug/article.md` — replace `TODO` sections
2. Open `content/XX-slug/evidence.json` — replace placeholder URLs
3. Set `"draft": false` in `meta.json` when ready to publish
4. Push to `main` — GitHub Actions rebuilds and deploys

**Do not edit** `dossiers/` or `manifest.json` by hand.

## Folder layout

```text
content/11-visa-mafia/
  article.md      ← investigation write-up (markdown)
  evidence.json   ← 4-slot template: document, reference, image, press
  meta.json       ← title, draft flag, RSS metadata
```

Episode number = **EP. XX** in the app (newest = 01).

## Draft vs live

| `meta.json` | App behavior |
|-------------|--------------|
| `"draft": true` | Folder exists, no DOSSIER badge (default for new scaffolds) |
| `"draft": false` | DOSSIER badge + Read Investigation button |

## New episodes on Spotify

When you publish a new episode, push anything to `content/` or run the workflow manually — `scaffold-from-rss.mjs` auto-creates the next folder.

```powershell
node scripts/scaffold-from-rss.mjs   # create missing folders locally
node scripts/build.mjs               # rebuild manifest + dossiers
```