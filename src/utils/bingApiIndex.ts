// src/utils/bingApiIndex.ts
import fs from 'fs';
import path from 'path';
import { siteDefaults } from '../config/siteDefaults';
import { siteFunctions } from '../config/siteFunctions';

type AssetsManifest = {
  indexNow?: { lastPing?: number; lastStatus?: number; lastSubmittedCount?: number };
  configModified?: Record<string, number>;
  [k: string]: any;
};

const ROOT = path.join(process.cwd());
const DATA_DIR = path.join(ROOT, 'src', 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MANIFEST_PATH = path.join(DATA_DIR, 'assets-manifest.json');
const INDEXNOW_TXT = 'indexNowKey.txt';
const INDEXNOW_TXT_PATH = path.join(PUBLIC_DIR, INDEXNOW_TXT);

function readManifest(): AssetsManifest {
  try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8')); }
  catch { return {}; }
}
function writeManifest(m: AssetsManifest) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2));
}
function ensurePublicDir() { fs.mkdirSync(PUBLIC_DIR, { recursive: true }); }

export function ensureIndexNowKeyFile(): { changed: boolean; keyLocation: string } {
  const key = (siteFunctions.bingAPIKey || '').trim();
  if (!key) {
    if (fs.existsSync(INDEXNOW_TXT_PATH)) fs.unlinkSync(INDEXNOW_TXT_PATH);
    return { changed: false, keyLocation: '' };
  }

  ensurePublicDir();
  const exists = fs.existsSync(INDEXNOW_TXT_PATH);
  const current = exists ? fs.readFileSync(INDEXNOW_TXT_PATH, 'utf-8').trim() : '';
  let changed = false;
  if (current !== key) {
    fs.writeFileSync(INDEXNOW_TXT_PATH, key, 'utf-8');
    const manifest = readManifest();
    manifest.configModified ||= {};
    manifest.configModified.siteFunctions = Date.now();
    writeManifest(manifest);
    changed = true;
  }
  const siteUrl = (siteDefaults.siteUrl || '').replace(/\/+$/, '');
  return { changed, keyLocation: siteUrl ? `${siteUrl}/${INDEXNOW_TXT}` : '' };
}

export async function submitToIndexNow(
  urls: string[] = [],
  opts?: { force?: boolean; minDaysBetween?: number; maxUrls?: number }
) {
  const indexEnabled = !!siteFunctions.index;
  const isProd = import.meta.env?.PROD === true;
  const minDays = Math.max(0, opts?.minDaysBetween ?? 14);
  const minMs = minDays * 24 * 60 * 60 * 1000;
  const maxUrls = Math.max(1, opts?.maxUrls ?? 50); // cap to be polite

  if (!indexEnabled && !opts?.force) return { skipped: true, reason: 'index disabled' };
  if (!isProd && !opts?.force) return { skipped: true, reason: 'not production' };

  const key = (siteFunctions.bingAPIKey || '').trim();
  if (!key) return { skipped: true, reason: 'missing bingAPIKey' };

  const siteUrl = (siteDefaults.siteUrl || '').replace(/\/+$/, '');
  if (!siteUrl) return { skipped: true, reason: 'missing siteUrl' };

  const manifest = readManifest();
  const meta = manifest.indexNow ?? {};
  const now = Date.now();

  if (!opts?.force && meta.lastPing && now - meta.lastPing < minMs) {
    const waitH = Math.ceil((minMs - (now - meta.lastPing)) / 3_600_000);
    return { skipped: true, reason: `throttled; try again in ~${waitH}h` };
  }

  const { keyLocation } = ensureIndexNowKeyFile();
  if (!keyLocation) return { skipped: true, reason: 'missing keyLocation' };

  // Fallback to sitemap(s) if no urls
  if (!urls || urls.length === 0) {
    urls = [`${siteUrl}/sitemap-index.xml`, `${siteUrl}/sitemap.xml`];
  } else {
    // If we have too many URLs, skip list and submit only sitemaps this run
    const uniqueCount = new Set(urls.filter(u => u.startsWith(siteUrl))).size;
    if (uniqueCount > (opts?.maxUrls ?? 50)) {
      urls = [`${siteUrl}/sitemap-index.xml`, `${siteUrl}/sitemap.xml`];
    }
  }

  // Same-host, unique, capped (cap is now mostly for safety, usually unused if fallback triggered)
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const urlList = Array.from(new Set(urls.filter(u => u.startsWith(siteUrl)))).slice(0, Math.max(1, opts?.maxUrls ?? 50));

  if (urlList.length === 0) return { skipped: true, reason: 'no valid urls for host' };

  const payload = { host, key, keyLocation, urlList };

  const res = await fetch('https://api.indexnow.org/IndexNow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  const usedSitemapFallback = urlList.some(u => /sitemap/.test(u));


  manifest.indexNow = {
    lastPing: now,
    lastStatus: res.status,
    lastSubmittedCount: urlList.length,
  };
  writeManifest(manifest);

  return { status: res.status, body: text, submitted: urlList, sitemapFallback: usedSitemapFallback };

}
