#!/usr/bin/env node
/**
 * Builds manifest.json + dossiers/*.json from content/{ep}-{slug}/ folders.
 * Fetches Spotify/Anchor RSS to map episode numbers → GUIDs automatically.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fetchRss, parseRss, toIsoDate } from "./lib/rss.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadConfig() {
  const configPath = path.join(ROOT, "build.config.json");
  const defaults = {
    rssUrl: "https://anchor.fm/s/1103ad32c/podcast/rss",
    pagesBaseUrl: "https://naas1201.github.io/thevault-content/dossiers/",
    contentDir: "content",
  };
  if (!fs.existsSync(configPath)) return defaults;
  return { ...defaults, ...readJson(configPath) };
}

function listContentFolders(contentDir) {
  if (!fs.existsSync(contentDir)) return [];
  return fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

function parseFolderName(name) {
  const m = name.match(/^(\d{1,3})-([a-z0-9][a-z0-9-]*)$/);
  if (!m) return null;
  return { episode: parseInt(m[1], 10), slug: m[2] };
}

function buildDossier({ slug, articleBody, evidence, meta, rssEpisode }) {
  const title =
    meta.title || (rssEpisode && rssEpisode.title) || slug.replace(/-/g, " ");
  const publishedAt =
    meta.publishedAt ||
    (rssEpisode ? toIsoDate(rssEpisode.pubDate) : "") ||
    new Date().toISOString().slice(0, 10);

  return {
    version: 1,
    slug,
    title,
    subtitle: meta.subtitle || "",
    publishedAt,
    article: {
      format: "markdown",
      body: articleBody.trim(),
    },
    evidence: Array.isArray(evidence) ? evidence : [],
  };
}

async function main() {
  const config = loadConfig();
  const contentDir = path.join(ROOT, config.contentDir);
  const dossiersDir = path.join(ROOT, "dossiers");

  console.log("Fetching RSS:", config.rssUrl);
  const rssXml = await fetchRss(config.rssUrl);
  const rssEpisodes = parseRss(rssXml);
  const byNumber = new Map(rssEpisodes.map((ep) => [ep.number, ep]));

  console.log(`RSS: ${rssEpisodes.length} episodes`);

  if (!fs.existsSync(dossiersDir)) fs.mkdirSync(dossiersDir, { recursive: true });

  const manifestEpisodes = {};
  const folders = listContentFolders(contentDir);
  let built = 0;
  let skipped = 0;

  for (const folder of folders) {
    const parsed = parseFolderName(folder);
    if (!parsed) {
      console.warn(`Skip ${folder}: use {episode}-{slug} naming, e.g. 11-visa-mafia`);
      skipped++;
      continue;
    }

    const folderPath = path.join(contentDir, folder);
    const articlePath = path.join(folderPath, "article.md");
    const evidencePath = path.join(folderPath, "evidence.json");
    const metaPath = path.join(folderPath, "meta.json");

    if (!fs.existsSync(articlePath)) {
      console.warn(`Skip ${folder}: missing article.md`);
      skipped++;
      continue;
    }

    const articleBody = fs.readFileSync(articlePath, "utf8");
    if (!articleBody.trim()) {
      console.warn(`Skip ${folder}: article.md is empty`);
      skipped++;
      continue;
    }

    let evidence = [];
    if (fs.existsSync(evidencePath)) {
      evidence = readJson(evidencePath);
    }

    let meta = {};
    if (fs.existsSync(metaPath)) {
      meta = readJson(metaPath);
    }

    const rssEpisode = byNumber.get(parsed.episode);
    if (!rssEpisode) {
      console.warn(
        `Warning ${folder}: episode ${parsed.episode} not in RSS (${rssEpisodes.length} items). Using ep:N only.`,
      );
    }

    const dossier = buildDossier({
      slug: parsed.slug,
      articleBody,
      evidence,
      meta,
      rssEpisode: rssEpisode || null,
    });

    const outPath = path.join(dossiersDir, `${parsed.slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(dossier, null, 2) + "\n", "utf8");
    built++;

    const isDraft = meta.draft === true;
    const entry = { slug: parsed.slug, hasDossier: !isDraft };

    manifestEpisodes[`ep:${parsed.episode}`] = entry;
    if (rssEpisode && rssEpisode.guid) {
      manifestEpisodes[rssEpisode.guid] = entry;
    }

    console.log(
      `Built ${parsed.slug} ← ${folder} (${isDraft ? "draft" : "live"})${
        rssEpisode ? ` [${rssEpisode.guid.slice(0, 8)}…]` : ""
      }`,
    );
  }

  const manifest = {
    version: 1,
    updatedAt: new Date().toISOString(),
    contentBaseUrl: config.pagesBaseUrl,
    episodes: manifestEpisodes,
  };

  fs.writeFileSync(
    path.join(ROOT, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8",
  );

  console.log(`\nDone: ${built} dossier(s), ${skipped} skipped, manifest updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});