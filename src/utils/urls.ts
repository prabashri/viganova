// src/utils/urls.ts
import { siteDefaults } from "@/config/siteDefaults";
import { siteFunctions } from "@/config/siteFunctions"; // if missing, export an empty object from it

type CdnMode = 'auto' | 'always' | 'never';
type CdnInput = CdnMode | 'yes' | 'no' | boolean;

interface UrlOptions {
  /** absolute final URL? (default false = return site-relative when cdn:'never') */
  absolute?: boolean;
  /** CDN behavior: 'auto' (assets only), 'always' (force), 'never' (disable)
   *  Also accepts 'yes' | 'no' | boolean for convenience.
   */
  cdn?: CdnInput;
  /** keep the hash fragment if present */
  keepHash?: boolean;
}
const ORIGIN = (() => {
  const base = (siteDefaults.siteUrl || "https://example.com").trim();
  const u = new URL(base);
  u.pathname = "/"; u.search = ""; u.hash = "";
  return u;
})();

const CDN_BASE = String(
  (siteFunctions as any)?.cdnUrl ||
  (siteFunctions as any)?.cdnPath ||
  (siteDefaults as any)?.cdnPath ||
  ""
).replace(/\/+$/, "");

const CDN_ASSET_ROOTS: string[] =
  ((siteFunctions as any)?.cdnAssets as string[] | undefined)?.map(
    s => `/${s.replace(/^\/?/, "").replace(/\/+$/, "")}/`
  ) ?? ["/images/","/videos/","/audio/","/css/","/js/","/documents/","/fonts/","/static/"];

const CDN_EXTS = new Set<string>([
  "png","jpg","jpeg","webp","avif","gif","svg",
  "mp4","webm","ogg","mp3","wav","m4a","aac",
  "pdf","doc","docx","xls","xlsx","ppt","pptx","txt","rtf","csv","json","xml",
  "css","js","mjs","cjs","map","woff","woff2","ttf","otf",
]);

function normalizePathLike(input: string): string {
  let s = input.replace(/\\/g, "/");
  const m = s.match(/^([a-z]+:\/\/)(.*)$/i);
  if (m) return m[1] + m[2].replace(/\/{2,}/g, "/");
  return s.replace(/\/{2,}/g, "/");
}

function stripTracking(u: URL) {
  ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid","ref"]
    .forEach(k => u.searchParams.delete(k));
}

function ensureLeadingSlash(p: string): string {
  const clean = p.replace(/^(\.\/|\/)+/, "");
  return "/" + clean;
}

function isAssetPathname(p: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(p);
}
function underCdnRoot(p: string): boolean {
  const withSlash = p.startsWith("/") ? p : `/${p}`;
  return CDN_ASSET_ROOTS.some(root => withSlash.startsWith(root));
}
function hasCdnExt(p: string): boolean {
  const m = p.toLowerCase().match(/\.([a-z0-9]{2,8})$/i);
  return !!(m && CDN_EXTS.has(m[1]));
}

function cdnize(pathname: string, search = ""): string {
  const path = ensureLeadingSlash(pathname);
  return CDN_BASE ? `${CDN_BASE}${path}${search}` : new URL(path + search, ORIGIN).toString();
}
function siteAbs(pathname: string, search = ""): string {
  const u = new URL(ensureLeadingSlash(pathname) + search, ORIGIN);
  return u.toString();
}

// NEW: normalize user-friendly 'cdn' inputs to canonical CdnMode
function normalizeCdn(input: CdnInput | undefined, fallback: CdnMode): CdnMode {
  if (input === undefined) return fallback;
  if (typeof input === 'boolean') return input ? 'always' : 'never';
  const s = String(input).toLowerCase();
  if (s === 'yes' || s === 'true') return 'always';
  if (s === 'no'  || s === 'false') return 'never';
  if (s === 'auto' || s === 'always' || s === 'never') return s as CdnMode;
  return fallback;
}

/** Core builder used by all exports */
function buildUrl(href?: string, opts: UrlOptions = {}): string {
  const { absolute = false, cdn = 'auto', keepHash = false } = opts;
  if (!href) return absolute ? ORIGIN.toString() : "/";

  const raw = normalizePathLike(href.trim());
  let url: URL | null = null;

  // Absolute input?
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    url = new URL(raw);
    stripTracking(url);
    if (!keepHash) url.hash = "";
    // External → never rewrite host (but 'always' can still CDN-ize by path)
    if (url.origin !== ORIGIN.origin) {
      if (cdn === 'always') return cdnize(url.pathname, url.search);
      return url.toString();
    }
  } else {
    // Relative input
    url = new URL(ensureLeadingSlash(raw), ORIGIN);
    stripTracking(url);
    if (!keepHash) url.hash = "";
  }

  // Decide CDN
  const assetLike = underCdnRoot(url.pathname) || hasCdnExt(url.pathname);
  const wantCdn =
    (cdn === 'always' && !!CDN_BASE) ||
    (cdn === 'auto'   && !!CDN_BASE && assetLike);

  if (wantCdn) {
    // Always return absolute when going through CDN
    return cdnize(url.pathname, url.search);
  }

  // Not CDN
  return absolute ? siteAbs(url.pathname, url.search) : ensureLeadingSlash(url.pathname) + url.search;
}

/* ---------------- Public API ---------------- */

/**
 * toRelativeUrl:
 * - If CDN is configured AND (cdn:'auto' with asset OR cdn:'always') → return CDN **absolute** URL.
 * - Else return **site-relative** "/path".
 * - External absolute URLs are returned as-is.
 */
export function toRelativeUrl(href?: string, opts: Partial<UrlOptions> = {}): string {
  const cdnMode = normalizeCdn(opts.cdn, 'auto');
  const keepHash = opts.keepHash ?? false;

  if (!href) return "/";

  const raw = normalizePathLike(href.trim());

  // Absolute input?
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
    const u = new URL(raw);
    stripTracking(u);
    if (!keepHash) u.hash = "";

    // external → return as-is
    if (u.origin !== ORIGIN.origin) return u.toString();

    // internal absolute → treat as path from here
    const path = u.pathname + u.search + (keepHash ? u.hash : "");
    href = path;
  }

  // Now we are guaranteed to be dealing with a path
  const pathOnly = ensureLeadingSlash(href!);
  const isAsset = underCdnRoot(pathOnly) || hasCdnExt(pathOnly);

  // CDN absolute only when enabled & requested
  if (
    CDN_BASE &&
    cdnMode !== 'never' &&
    (cdnMode === 'always' || (cdnMode === 'auto' && isAsset))
  ) {
    return `${CDN_BASE}${pathOnly}`;
  }

  // Otherwise strictly return site-relative
  return pathOnly;
}


/**
 * toCdnUrl:
 * Force CDN for any input. If CDN not set, falls back to site absolute.
 */
export function toCdnUrl(href: string): string {
  return buildUrl(href, { absolute: true, cdn: 'always' });
}

/**
 * toAbsoluteUrl:
 * Absolute URL on **site origin** (never CDN) — use for canonicals, schema page URLs.
 * accept optional options, especially { cdn: 'no' } / { cdn: false }
 */
export function toAbsoluteUrl(href?: string, opts?: Partial<UrlOptions>): string {
  // For SEO safety, default is absolute on site origin (cdn:never)
  const cdnMode = normalizeCdn(opts?.cdn, 'never');
  const keepHash = opts?.keepHash ?? false;
  return buildUrl(href, { absolute: true, cdn: cdnMode, keepHash });
}

/** Convenience helpers (nice ergonomics) */
export const assetUrl   = (href: string) => buildUrl(href, { absolute: false,  cdn: 'auto'   }); // for <img>, <video>, CSS/JS links
export const pageUrl    = (href: string) => buildUrl(href, { absolute: true,  cdn: 'never'  }); // for routes & canonicals
export const schemaUrl  = (href: string) => buildUrl(href, { absolute: true,  cdn: 'never'  }); // for JSON-LD contentUrl/@id
export const relativeNoCdn = (href: string) => buildUrl(href, { absolute: false, cdn: 'never' }); // rare: you really want "/path" only

/** Stable node ids from canonical absolute URL (never CDN) */
export function idFor(kind: string, href?: string): string {
  // canonical absolute URL on site origin
  const base = toAbsoluteUrl(href || "/", { cdn: 'never' });

  // normalize the fragment: trim, collapse spaces, allow [a-z0-9-_]
  const slug = String(kind)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')          // spaces → dashes
    .replace(/[^a-z0-9_-]+/g, ''); // strip unsafe chars

  // ensure no double "##" if caller passed a '#kind'
  const frag = slug.replace(/^#+/, '');

  return `${base}#${frag}`;
}

/* usage examples:

// 1) For <img>, <source>, preload link HREFs
const src = toRelativeUrl("images/hero.webp");
// → "https://nviews-b-cdn.net/images/hero.webp" (CDN on)
// → "/images/hero.webp" (no CDN)

// 2) Force CDN regardless of path kind (useful when you *always* want CDN)
const cdnSrc = toCdnUrl("https://mysite.com/images/hero.webp");
// → "https://nviews-b-cdn.net/images/hero.webp"

// 3) Keep absolute site URL (for canonicals, JSON-LD pages, etc.)
const pageAbs = toAbsoluteUrl("/blog/post-slug");
// → "https://mysite.com/blog/post-slug/"
*/