// src/scripts/generate-last-modified-dates.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ⚠️ Adjust if your siteDefaults lives elsewhere
import { siteDefaults } from '../config/siteDefaults'; // alias: '@/config/siteDefaults'

const OUTPUT_FILE = 'src/data/modified-dates.json';

// Rooted locations
const SRC_DIR = 'src';
const CONTENT_DIR = path.join(SRC_DIR, 'content');
const PAGES_DIR = path.join(CONTENT_DIR, 'pages');

const ALLOWED_EXT = new Set(['.md', '.mdx', '.astro', '.html']);

// Legacy/explicit fallbacks for well-known pages (kept for safety)
const LEGACY_PAGE_FILES: Record<string, string[]> = {
  index: [
    path.join(CONTENT_DIR, 'pages', 'Home.astro'),
    path.join(SRC_DIR, 'pages', 'index.astro'),
  ],
  about: [path.join(CONTENT_DIR, 'pages', 'About.astro')],
  'privacy-policy': [path.join(CONTENT_DIR, 'pages', 'PrivacyPolicy.astro')],
  terms: [path.join(CONTENT_DIR, 'pages', 'Terms.astro')],
  contact: [path.join(CONTENT_DIR, 'pages', 'Contact.astro')],
  search: [path.join(CONTENT_DIR, 'pages', 'Search.astro')],
  'not-found': [
    path.join(CONTENT_DIR, 'pages', 'NotFound.astro'),
    path.join(SRC_DIR, 'pages', '404.astro'),
  ],
};

/* ---------------- publish-date floor (parse once) ---------------- */
const SITE_PUBLISHED_RAW = (siteDefaults as any)?.publishedDate as string | undefined;
const SITE_TIMEZONE = (siteDefaults as any)?.dateFormat?.timeZone as string | undefined;
const SITE_PUBLISHED_DATE = parseLooseDate(SITE_PUBLISHED_RAW); // Date in UTC (00:00)

/** Clamp to site publish date: use the later of (file last-modified, site publishedDate) */
function clampToSitePublish(isoWithOffset: string): string {
  if (!SITE_PUBLISHED_DATE) return isoWithOffset;
  const lm = new Date(isoWithOffset);
  if (!isFinite(+lm)) return isoWithOffset;
  return +lm < +SITE_PUBLISHED_DATE
    ? toIsoWithTimeZone(SITE_PUBLISHED_DATE, SITE_TIMEZONE)
    : isoWithOffset;
}

/* ---------------- Date helpers ---------------- */

/** Git commit time (ISO with offset) if possible, else FS mtime w/offset */
function getLastModified(filePath: string): string {
  try {
    const out = execSync(
      `git log -1 --pretty="format:%cI" "${filePath}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    if (out) return out; // e.g., 2025-09-10T23:03:05+09:00
  } catch { /* ignore */ }
  const stat = fs.statSync(filePath);
  return toIsoWithOffset(stat.mtime);
}

/** Convert Date → ISO string with a specific IANA timezone's offset, e.g. +05:30 */
function toIsoWithTimeZone(d: Date, timeZone?: string): string {
  if (!timeZone) return toIsoWithOffset(d); // fallback to local offset
  const pad = (n: number) => String(n).padStart(2, '0');

  // Get wall-clock in target TZ using Intl, then compute offset in minutes
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);

  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const y = get('year'); const mo = get('month'); const da = get('day');
  const hh = get('hour'); const mm = get('minute'); const ss = get('second');

  // This is the UTC time that shows those TZ wall-clock parts
  const tzAsUTC = Date.UTC(y, (mo ?? 1) - 1, da ?? 1, hh ?? 0, mm ?? 0, ss ?? 0);
  const offsetMin = Math.round((tzAsUTC - d.getTime()) / 60000); // minutes ahead of UTC
  const sign = offsetMin >= 0 ? '+' : '-';
  const th = pad(Math.floor(Math.abs(offsetMin) / 60));
  const tm = pad(Math.abs(offsetMin) % 60);

  return `${y}-${pad(mo)}-${pad(da)}T${pad(hh)}:${pad(mm)}:${pad(ss)}${sign}${th}:${tm}`;
}

/** Convert Date → local ISO with timezone offset, e.g. 2025-08-08T13:31:16+09:00 */
function toIsoWithOffset(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  const tz = -d.getTimezoneOffset(); // minutes
  const sign = tz >= 0 ? '+' : '-';
  const th = pad(Math.floor(Math.abs(tz) / 60));
  const tm = pad(Math.abs(tz) % 60);
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}${sign}${th}:${tm}`;
}

/** Very small "loose" parser for human dates (UTC midnight) + ISO */
function parseLooseDate(input?: string): Date | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;

  // ISO / RFC / offset
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) || /Z$|[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
  }

  // YYYY-MM(-DD)
  {
    const m = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(s);
    if (m) {
      const y = +m[1], mo = +(m[2] ?? 1), da = +(m[3] ?? 1);
      const d = new Date(Date.UTC(y, mo - 1, da));
      return isNaN(d.getTime()) ? undefined : d;
    }
  }

  // "Sep 01, 2025" | "September 12 2025"
  {
    const m = /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})$/.exec(s);
    if (m) {
      const mon = monthIndex(m[1]); const day = +m[2]; const year = +m[3];
      if (mon >= 0) return new Date(Date.UTC(year, mon, day));
    }
  }

  // "2 September 2025" | "2nd Sep 2025"
  {
    const m = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(?:,?\s*)?(\d{4})$/.exec(s);
    if (m) {
      const day = +m[1]; const mon = monthIndex(m[2]); const year = +m[3];
      if (mon >= 0) return new Date(Date.UTC(year, mon, day));
    }
  }

  // Fallback
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function monthIndex(name: string): number {
  const s = name.toLowerCase();
  const long = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const short = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let i = long.indexOf(s);
  if (i >= 0) return i;
  i = short.indexOf(s);
  return i >= 0 ? i : -1;
}

/** Recursively collect file paths under a dir */
function walkDir(dir: string, list: string[] = []): string[] {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fp, list);
    } else if (ALLOWED_EXT.has(path.extname(entry.name))) {
      list.push(fp);
    }
  }
  return list;
}

/** Returns first existing file from candidates */
function firstExisting(candidates: string[]): string | undefined {
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return undefined;
}

/** slugify helpers */
const toKebab = (s: string) =>
  s.trim().replace(/^[#/]+|\/+$/g, '').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-]/g, '-').replace(/--+/g, '-').toLowerCase();

const toPascal = (s: string) =>
  s.split(/[-_/ ]+/).filter(Boolean).map(w => w[0]?.toUpperCase() + w.slice(1)).join('');

/**
 * Resolve a page's file path using priority:
 * 1) siteDefaults.pages[key].location
 * 2) from pages[key].path slug
 * 3) from key
 * 4) legacy fallbacks
 */
function resolvePageFile(key: string, page: any): string | undefined {
  const candidates: string[] = [];

  const loc = page?.location as string | undefined;
  if (loc) {
    const p = loc.startsWith('src/') ? loc : path.join('src', loc.replace(/^\/+/, ''));
    candidates.push(p);
  }

  const pagePath = typeof page?.path === 'string' ? page.path : '';
  const fromPathSlug = pagePath ? toKebab(pagePath.split('/').filter(Boolean).pop() || '') : '';
  if (fromPathSlug) {
    const pas = toPascal(fromPathSlug);
    candidates.push(path.join(PAGES_DIR, `${pas}.astro`), path.join(PAGES_DIR, `${fromPathSlug}.astro`));
  }

  const keyKebab = toKebab(key);
  const keyPascal = toPascal(keyKebab);
  candidates.push(path.join(PAGES_DIR, `${keyPascal}.astro`), path.join(PAGES_DIR, `${keyKebab}.astro`));

  if (LEGACY_PAGE_FILES[key]) candidates.push(...LEGACY_PAGE_FILES[key]);
  return firstExisting(candidates);
}

function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ---------------- Build the map ---------------- */
(async () => {
  const modifiedMap: Record<string, string> = {};

  // 1) Handle "pages" declared in siteDefaults
  const pages = (siteDefaults as any)?.pages ?? {};
  for (const [key, cfg] of Object.entries(pages)) {
    if (cfg && typeof cfg === 'object' && 'enabled' in cfg && (cfg as any).enabled === false) continue;
    const file = resolvePageFile(key, cfg);
    if (file) {
      const lm = getLastModified(file);
      modifiedMap[key] = clampToSitePublish(lm);
    }
  }

  // 2) Auto-discover any .astro under src/content/pages not already mapped
  if (fs.existsSync(PAGES_DIR)) {
    for (const entry of fs.readdirSync(PAGES_DIR, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (path.extname(entry.name) !== '.astro') continue;

      const base = path.basename(entry.name, '.astro');
      const alreadyCovered = Object.values(pages).some((cfg: any) => {
        const f = resolvePageFile('tmp', cfg);
        return f && path.resolve(f) === path.resolve(path.join(PAGES_DIR, entry.name));
      });
      if (alreadyCovered) continue;

      const discoveredKey = `page:${toKebab(base)}`;
      const abs = path.join(PAGES_DIR, entry.name);
      const lm = getLastModified(abs);
      modifiedMap[discoveredKey] = clampToSitePublish(lm);
    }
  }

  // 3) All other content items under src/content/** (except pages/**)
  const contentFiles = walkDir(CONTENT_DIR);
  for (const abs of contentFiles) {
    const rel = path.relative(CONTENT_DIR, abs).replace(/\\/g, '/');
    if (rel.startsWith('pages/')) continue;
    const key = rel.replace(path.extname(rel), '');
    const lm = getLastModified(abs);
    modifiedMap[key] = clampToSitePublish(lm);
  }

  writeJson(OUTPUT_FILE, modifiedMap);
  console.log(`✅ Modified dates written to ${OUTPUT_FILE}`);
})().catch((err) => {
  console.error('❌ Failed to generate modified dates:', err);
  process.exit(1);
});
