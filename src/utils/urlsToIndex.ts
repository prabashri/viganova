// src/utils/urlsToIndex.ts
import fs from 'fs';
import path from 'path';
import { siteDefaults } from '../config/siteDefaults';

type ModifiedDates = Record<string, string>;
type Manifest = { indexNow?: { lastPing?: number } };

const ROOT = path.join(process.cwd());
const DATA_DIR = path.join(ROOT, 'src', 'data');
const MODIFIED_DATES_PATH = path.join(DATA_DIR, 'modified-dates.json');
const MANIFEST_PATH = path.join(DATA_DIR, 'assets-manifest.json');
const URLS_TXT = path.join(ROOT, 'public', 'urls-to-index.txt');

function readJSON<T=any>(p: string): T {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return {} as T; }
}
function toEpoch(s: string) { const n = Date.parse(s); return Number.isFinite(n) ? n : 0; }
function siteBase() { return (siteDefaults.siteUrl || '').replace(/\/+$/, ''); }

function slugToPath(slug: string) {
  if (slug === 'index') return '/';
  return `/${slug.replace(/^\/+/, '')}`;
}

function isSlugAllowed(slug: string): boolean {
  // exclude any path segment starting with "_"
  if (slug.split('/').some(seg => seg.startsWith('_'))) return false;

  // optional: respect collection sitemap flag
  const first = slug.split('/')[0]; // e.g., 'blog', 'post', 'team'
  const collections = (siteDefaults as any).collections || {};
  const cfg = collections[first];
  if (cfg && typeof cfg.sitemap === 'boolean' && !cfg.sitemap) return false;

  return true;
}

export function getUpdatedUrlsSinceLastPing(): string[] {
  const modified = readJSON<ModifiedDates>(MODIFIED_DATES_PATH);
  const manifest = readJSON<Manifest>(MANIFEST_PATH);
  const lastPing = Number(manifest?.indexNow?.lastPing || 0);
  const base = siteBase();
  if (!base) return [];

  const urls = Object.entries(modified)
    .filter(([slug, iso]) => isSlugAllowed(slug) && toEpoch(iso) > lastPing)
    .map(([slug]) => `${base}${slugToPath(slug)}`);

  const unique = Array.from(new Set(urls)).sort();

  fs.mkdirSync(path.dirname(URLS_TXT), { recursive: true });
  fs.writeFileSync(URLS_TXT, unique.join('\n') + (unique.length ? '\n' : ''), 'utf-8');

  return unique;
}
