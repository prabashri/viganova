// src/utils/getImage.ts
import imageMetadataJson from '@/data/image-format-details.json' assert { type: 'json' };
import { siteImages } from '@/config/siteImages';
import type { ImageFormat, ImageMetaSlim, ImageVariant } from '@/types/imageProps';

type MetaEntry = {
  lastModified: number;
  path: string;        // "/YYYY/MM/"
  variants: string[];  // ["120","380","640","960","1280"]
  format: string[];    // ["avif","webp","png"]
  aspect: string;      // "16x9" | "1x1" | "4x3" ...
  thumbnail?: string;
};

const META = imageMetadataJson as Record<string, MetaEntry>;
const DEFAULT_FORMAT_ORDER: readonly ImageFormat[] = ['webp', 'png', 'avif', 'jpg', 'jpeg'];

// -------- helpers (scoped) ----------
const cfgV = siteImages?.variants ?? {};
const PUBLIC_PREFIX = (siteImages as any).publicFolder?.replace(/^\.?\/?public\/?/, '').replace(/^\/+/, '') || 'images';

// anchor-aware fallbacks if a label width is missing in config
const SIZE_FALLBACKS: Record<ImageVariant, ImageVariant[]> = {
  desktop:  ['full', 'mobile', 'tablet', 'featured', 'thumbnail', 'avatar'],
  featured: ['full', 'desktop', 'mobile', 'tablet', 'thumbnail', 'avatar'],
  mobile:   ['desktop', 'featured', 'tablet', 'thumbnail', 'avatar', 'full'],
  tablet:   ['desktop', 'featured', 'mobile', 'thumbnail', 'avatar', 'full'],
  thumbnail:['avatar', 'mobile', 'tablet', 'desktop', 'featured', 'full'],
  avatar:   ['thumbnail', 'mobile', 'tablet', 'desktop', 'featured', 'full'],
  full:     ['featured', 'desktop', 'tablet', 'mobile', 'thumbnail', 'avatar']
};

function baseName(key: string): string {
  return key.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
}

function heightFromAspect(aspect: string, width: number): number {
  const [aw, ah] = aspect.split('x').map(Number);
  if (!aw || !ah) return width;
  return Math.round(width * (ah / aw));
}

function pickFormat(available: string[], requested?: ImageFormat): string {
  if (requested && available.includes(requested)) return requested;
  for (const f of DEFAULT_FORMAT_ORDER) if (available.includes(f)) return f;
  return available[0] || 'png';
}

function pickAvailableWidth(available: string[], target?: number): number {
  const widths = available.map(Number).sort((a, b) => a - b);
  if (!widths.length) return target ?? 0;
  if (!target) return widths[widths.length - 1]; // max
  const le = widths.filter(w => w <= target).pop();
  return le ?? widths[0];
}

function resolveTargetWidth(label?: ImageVariant): number | undefined {
  if (!label) return undefined;
  if (cfgV[label]) return cfgV[label]!;
  // walk fallbacks
  for (const next of SIZE_FALLBACKS[label]) {
    if (cfgV[next]) return cfgV[next]!;
  }
  return undefined;
}

// Build URL with meta fields
function url(meta: MetaEntry | ImageMetaSlim, width: number, fmt: string): string {
  return `${(meta as any).path ? `${PUBLIC_PREFIX}${(meta as any).path}` : ''}${(meta as any).path ? '' : ''}`; // lint pacifier
}

// actual URL builder from (path,sizes,formats,aspect)
function buildUrl(pathBase: string, width: number, aspect: string, fmt: string): string {
  return `${pathBase}-w${width}-a${aspect}.${fmt}`;
}

// derive a normalized base path "images/YYYY/MM/name" from either MetaEntry or ImageMetaSlim
function pathBaseFrom(kind: MetaEntry | ImageMetaSlim, key?: string): string {
  if ((kind as MetaEntry).path) {
    // MetaEntry (has path starting with "/YYYY/MM/")
    const m = kind as MetaEntry;
    const name = baseName(key || '');
    return `${PUBLIC_PREFIX}${m.path}${name}`.replace(/\/{2,}/g, '/');
  } else {
    // ImageMetaSlim (already has "images/YYYY/MM/name")
    return (kind as ImageMetaSlim).path;
  }
}

// ------------- Public APIs -------------

/**
 * Single public URL (no domain).
 * - getImage(key) → max PNG
 * - getImage(key,'desktop','webp') → nearest desktop width in webp (fallbacks if missing)
 */
export function getImage(key: string, size?: ImageVariant, format?: ImageFormat): string | null {
  if (!key) return null;
  const meta = META[key];
  if (!meta) return null;

  const target = resolveTargetWidth(size);
  const width = pickAvailableWidth(meta.variants, target);
  const fmt = pickFormat(meta.format, format);

  const pathBase = pathBaseFrom(meta, key);
  return buildUrl(pathBase, width, meta.aspect, fmt);
}

/**
 * Return { path, sizes, formats, aspect } for a key.
 * Use with constructUrl() to generate any URLs without rereading JSON.
 */
export function getImageMeta(key: string): ImageMetaSlim | null {
  if (!key) return null;
  const meta = META[key];
  if (!meta) return null;

  const name = baseName(key);
  const pathBase = `${PUBLIC_PREFIX}${meta.path}${name}`.replace(/\/{2,}/g, '/');

  return {
    path: pathBase,
    sizes: meta.variants,
    formats: meta.format,
    aspect: meta.aspect
  };
}

// ---------- constructUrl (flexible) ----------

/**
 * constructUrl(meta) → string[]               // all widths × all formats
 * constructUrl(meta, 'webp') → string[]       // all widths in webp
 * constructUrl(meta, 'desktop') → string[]    // one width (desktop) in all formats
 * constructUrl(meta, 'desktop', 'webp') → string  // one URL
 */
export function constructUrl(meta: ImageMetaSlim, sizeOrFormat?: ImageVariant | ImageFormat, maybeFormat?: ImageFormat): string | string[] {
  const isSizeLabel = (v: any): v is ImageVariant =>
    v === 'avatar' || v === 'thumbnail' || v === 'mobile' || v === 'desktop' || v === 'featured' || v === 'full';

  // case 1: both size + format -> single URL
  if (isSizeLabel(sizeOrFormat) && maybeFormat) {
    const target = resolveTargetWidth(sizeOrFormat);
    const width = pickAvailableWidth(meta.sizes, target);
    const fmt = pickFormat(meta.formats, maybeFormat);
    return buildUrl(meta.path, width, meta.aspect, fmt);
  }

  // case 2: only format -> all sizes in that format
  if (typeof sizeOrFormat === 'string' && !isSizeLabel(sizeOrFormat)) {
    const fmt = pickFormat(meta.formats, sizeOrFormat);
    return meta.sizes
      .map(Number)
      .sort((a, b) => a - b)
      .map(w => buildUrl(meta.path, w, meta.aspect, fmt));
  }

  // case 3: only size -> one width in all formats
  if (isSizeLabel(sizeOrFormat)) {
    const target = resolveTargetWidth(sizeOrFormat);
    const width = pickAvailableWidth(meta.sizes, target);
    const fmts = [...meta.formats].sort(
      (a, b) => DEFAULT_FORMAT_ORDER.indexOf(a as ImageFormat) - DEFAULT_FORMAT_ORDER.indexOf(b as ImageFormat)
    );
    return fmts.map(fmt => buildUrl(meta.path, width, meta.aspect, fmt));
  }

  // case 4: nothing -> all widths × all formats
  const widths = meta.sizes.map(Number).sort((a, b) => a - b);
  const fmts = [...meta.formats].sort(
    (a, b) => DEFAULT_FORMAT_ORDER.indexOf(a as ImageFormat) - DEFAULT_FORMAT_ORDER.indexOf(b as ImageFormat)
  );
  const urls: string[] = [];
  for (const w of widths) {
    for (const f of fmts) urls.push(buildUrl(meta.path, w, meta.aspect, f));
  }
  return urls;
}
/*
Usage examples

import { getImage, getImageMeta, constructUrl } from '@/utils/getImage';

// Single best URL (nearest desktop, prefer webp)
const desktopWebp = getImage('featured/hero.png', 'desktop', 'webp');
// → "images/2025/08/hero-w640-a16x9.webp"

// Meta (read JSON once)
const hero = getImageMeta('featured/hero.png');
// hero = { path: "images/2025/08/hero", sizes:["120","380","640","960","1280"], formats:["avif","webp","png"], aspect:"16x9" }

// All sizes in a single format
const allWebp = constructUrl(hero!, 'webp'); // string[]

// One width (desktop) in all formats
const desktopAllFormats = constructUrl(hero!, 'desktop'); // string[]

// One exact choice: desktop + webp
const oneUrl = constructUrl(hero!, 'desktop', 'webp'); // string

// Everything (all sizes × all formats)
const everyUrl = constructUrl(hero!); // string[]

*/