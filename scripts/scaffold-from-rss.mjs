#!/usr/bin/env node
/**
 * Creates content/{ep}-{slug}/ folders for every episode in the Spotify/Anchor RSS.
 * Skips folders that already exist. Never overwrites article.md or evidence.json.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  fetchRss,
  parseRss,
  slugFromLink,
  slugFromTitle,
  toIsoDate,
  uniqueSlug,
} from "./lib/rss.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadConfig() {
  const configPath = path.join(ROOT, "build.config.json");
  if (!fs.existsSync(configPath)) {
    return {
      rssUrl: "https://anchor.fm/s/1103ad32c/podcast/rss",
      contentDir: "content",
    };
  }
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function padEp(n) {
  return String(n).padStart(2, "0");
}

function existingEpisodeNumbers(contentDir) {
  const found = new Set();
  if (!fs.existsSync(contentDir)) return found;
  for (const name of fs.readdirSync(contentDir)) {
    const m = name.match(/^(\d{1,3})-/);
    if (m) found.add(parseInt(m[1], 10));
  }
  return found;
}

function firstSentence(text) {
  const t = String(text || "").trim();
  if (!t) return "";
  const m = t.match(/^(.+?[.!?])(?:\s|$)/);
  return m ? m[1].trim() : t.slice(0, 140);
}

function buildArticle(ep) {
  const brief = ep.descriptionPlain || "_No RSS description available._";
  return `<!-- dossier-scaffold: replace TODO sections, then set "draft": false in meta.json -->

## Executive summary

TODO: One-paragraph overview of **${ep.title}**.

## What we investigated

- TODO: Core question this episode answers
- TODO: Institution, company, or policy under scrutiny
- TODO: What public records or testimony were examined

## Key findings

1. **TODO.** Supporting detail with a specific fact or figure.
2. **TODO.** Supporting detail — who benefited, who paid the cost.
3. **TODO.** Supporting detail — what regulators or courts did (or failed to do).

## Why this matters

TODO: Why the listener should care beyond the headline.

## Method note

This dossier accompanies **EP. ${String(ep.number).padStart(2, "0")}** (*${ep.title}*). Replace every placeholder URL in \`evidence.json\` before setting \`"draft": false\` in \`meta.json\`.

---

### Episode brief (from Spotify RSS — delete this section when done)

${brief}
`;
}

function buildEvidence(ep, slug) {
  return [
    {
      id: `ev-${slug}-1`,
      type: "document",
      title: "TODO: Primary source document",
      description: `Official report, filing, or court record cited in: ${ep.title}`,
      url: "https://REPLACE_WITH_PRIMARY_SOURCE_URL",
      source: "TODO: Publisher / agency name",
      date: toIsoDate(ep.pubDate) || "YYYY-MM-DD",
      tags: ["primary-source", "todo"],
    },
    {
      id: `ev-${slug}-2`,
      type: "link",
      title: "TODO: Reference article or database",
      description: "Background context, regulator page, or investigative report",
      url: "https://REPLACE_WITH_REFERENCE_URL",
      source: "TODO",
      tags: ["reference", "todo"],
    },
    {
      id: `ev-${slug}-3`,
      type: "image",
      title: "TODO: Chart, timeline, or diagram",
      description: "Visual used in the episode or supporting your key finding",
      url: "https://REPLACE_WITH_IMAGE_URL",
      thumbnail: "https://REPLACE_WITH_THUMBNAIL_URL",
      tags: ["analysis", "todo"],
    },
    {
      id: `ev-${slug}-4`,
      type: "link",
      title: "TODO: On-air source or press coverage",
      description: "News item, press release, or transcript referenced on-air",
      url: "https://REPLACE_WITH_PRESS_URL",
      source: "TODO",
      tags: ["press", "todo"],
    },
  ];
}

function buildMeta(ep, slug) {
  return {
    title: ep.title,
    subtitle: firstSentence(ep.descriptionPlain) || "Investigation dossier",
    publishedAt: toIsoDate(ep.pubDate),
    draft: true,
    guid: ep.guid,
    spotifyUrl: ep.link,
    slug,
    episode: ep.number,
  };
}

function buildEpisodesIndex(episodes, contentDir) {
  const lines = [
    "# Episode index (auto-generated from Spotify RSS)",
    "",
    "Newest episode = **EP. 01**. Edit the matching folder under `content/`.",
    "",
    "| EP | Folder | Title | Status |",
    "|----|--------|-------|--------|",
  ];

  for (const ep of episodes) {
    const folders = fs.existsSync(contentDir)
      ? fs.readdirSync(contentDir).filter((d) => d.startsWith(padEp(ep.number) + "-"))
      : [];
    const folder = folders[0] || `${padEp(ep.number)}-???`;
    let status = "scaffold";
    const metaPath = path.join(contentDir, folder, "meta.json");
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        status = meta.draft === false ? "live" : "draft";
      } catch (e) {
        status = "?";
      }
    } else if (folders.length === 0) {
      status = "missing";
    }
    lines.push(
      `| ${String(ep.number).padStart(2, "0")} | \`${folder}\` | ${ep.title.replace(/\|/g, "/")} | ${status} |`,
    );
  }

  lines.push("", "_Regenerate: `node scripts/scaffold-from-rss.mjs`_");
  return lines.join("\n") + "\n";
}

async function main() {
  const config = loadConfig();
  const contentDir = path.join(ROOT, config.contentDir || "content");
  if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });

  const xml = await fetchRss(config.rssUrl);
  const episodes = parseRss(xml);
  const existing = existingEpisodeNumbers(contentDir);
  const usedSlugs = new Set();

  for (const name of fs.readdirSync(contentDir)) {
    const m = name.match(/^\d{1,3}-([a-z0-9-]+)$/);
    if (m) usedSlugs.add(m[1]);
  }

  let created = 0;
  let skipped = 0;

  for (const ep of episodes) {
    if (existing.has(ep.number)) {
      skipped++;
      continue;
    }

    const baseSlug = slugFromLink(ep.link) || slugFromTitle(ep.title);
    const slug = uniqueSlug(baseSlug, usedSlugs);
    const folder = `${padEp(ep.number)}-${slug}`;
    const folderPath = path.join(contentDir, folder);

    fs.mkdirSync(folderPath, { recursive: true });
    fs.writeFileSync(path.join(folderPath, "article.md"), buildArticle(ep), "utf8");
    fs.writeFileSync(
      path.join(folderPath, "evidence.json"),
      JSON.stringify(buildEvidence(ep, slug), null, 2) + "\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(folderPath, "meta.json"),
      JSON.stringify(buildMeta(ep, slug), null, 2) + "\n",
      "utf8",
    );

    console.log(`Created ${folder} — ${ep.title}`);
    created++;
  }

  fs.writeFileSync(
    path.join(contentDir, "EPISODES.md"),
    buildEpisodesIndex(episodes, contentDir),
    "utf8",
  );

  console.log(`\nDone: ${created} created, ${skipped} already existed, ${episodes.length} in RSS.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});