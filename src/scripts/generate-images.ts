// src/scripts/generate-images.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { siteImages } from '@/config/siteImages';
import { getConfigModified, updateConfigModified } from '@/utils/configModified';

interface ImageMetadataEntry {
  lastModified: number;     // source file mtime
  path: string;             // "/YYYY/MM/"
  variants: string[];       // widths emitted
  format: string[];         // formats emitted (configured + original)
  aspect: string;           // chosen nearest aspect label (e.g. "16x9")
  thumbnail?: string;       // "120" if present
}
interface FullMetadata { [relKey: string]: ImageMetadataEntry | number; }

type ScanOptions = {
  sizesBase: number[];        // ONLY configured sizes
  allowUpscale: boolean;
  keyPrefix?: string;         // 'avatar' | 'profile' | '' (general)
  absRoot: string;            // absolute root used to compute relKey
  collectedKeys: Set<string>;
  includeThumbnail?: boolean; // gate for adding variants.thumbnail
  featuredAbs?: string;       // absolute featured folder to detect featured files
  excludeAbsDirs?: string[];  // absolute directories to skip when recursing
};

// ===== Config =====
const {
  inputImageFolder,
  avatarFolder,
  profileFolder,
  featuredImageFolder,
  outputImageBase,
  imageFormats,
  compressionLevel,
  imageVariants,
  variants,
  thumbnail: thumbnailEnabled,
} = siteImages as {
  inputImageFolder: string;
  avatarFolder: string;
  profileFolder: string;
  featuredImageFolder: string;
  outputImageBase: string;
  imageFormats: string[];
  compressionLevel: number;
  imageVariants?: number[];
  variants?: Partial<Record<'avatar'|'thumbnail'|'featured'|'mobile'|'tablet'|'desktop'|'full', number>>;
  thumbnail?: boolean;
};

const metadataFile = path.resolve('./src/data/image-format-details.json');
const siteImagesConfigPath = path.resolve('src/config/siteImages.ts');

// ===== Aspect map (full) =====
const aspectRatios: Record<string, number> = {
  '1x1': 1,
  '4x3': 4 / 3,
  '16x9': 16 / 9,
  '9x16': 9 / 16,
  '3x4': 3 / 4,
  '4x5': 4 / 5,
  '5x4': 5 / 4,
  '2x3': 2 / 3,
  '3x2': 3 / 2,
  '3x1': 3 / 1,
  '1x3': 1 / 3,
  '2x1': 2 / 1,
  '1x2': 1 / 2,
};

// ===== Helpers =====
// slugify output base name (lowercase, hyphens)
function slugifyBaseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')        // spaces/underscores -> hyphen
    .replace(/[^a-z0-9-]+/g, '-')   // non-alnum -> hyphen
    .replace(/-+/g, '-')            // collapse multiple hyphens
    .replace(/^-|-$/g, '');         // trim hyphens at ends
}
// build output filename with width + aspect
function outName(base: string, w: string | number, aspect: string, fmt: string) {
  return `${base}-w${w}-a${aspect}.${extFor(fmt)}`;
}

function getDateFolder(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function getSiteImagesConfigTime(): number {
  return fs.existsSync(siteImagesConfigPath)
    ? Math.floor(fs.statSync(siteImagesConfigPath).mtimeMs)
    : 0;
}
function loadMetadata(): FullMetadata {
  try { return JSON.parse(fs.readFileSync(metadataFile, 'utf-8')); }
  catch { return {}; }
}
function saveMetadata(data: FullMetadata): void {
  const sorted: Record<string, any> = {};
  Object.keys(data).sort().forEach(k => (sorted[k] = (data as any)[k]));
  fs.mkdirSync(path.dirname(metadataFile), { recursive: true });
  fs.writeFileSync(metadataFile, JSON.stringify(sorted, null, 2));
  console.log('📦 Wrote image-format-details.json');
}
function uniqSorted(nums: Array<number | undefined>): number[] {
  return Array.from(new Set(nums.filter((n): n is number => typeof n === 'number' && n > 0)))
    .sort((a, b) => a - b);
}
function nearestAspectName(w: number, h: number): string {
  const r = w / h;
  let bestName = '1x1';
  let bestDiff = Infinity;
  for (const [name, val] of Object.entries(aspectRatios)) {
    const diff = Math.abs(r - val);
    if (diff < bestDiff) { bestDiff = diff; bestName = name; }
  }
  return bestName;
}
function heightFor(width: number, aspectName: string): number {
  const a = aspectRatios[aspectName] ?? 1;
  return Math.round(width / a);
}
function extFor(format: string) {
  return format === 'jpeg' ? 'jpg' : format;
}
function outputDirFor(dateFolder: string) {
  const outDir = path.join(outputImageBase, dateFolder);
  fs.mkdirSync(outDir, { recursive: true });
  return outDir;
}
function fileOutputsExistWithAspect(
  base: string,
  outDir: string,
  widths: string[],
  fmts: string[],
  aspect: string
): boolean {
  return widths.every(w =>
    fmts.every(f =>
      fs.existsSync(path.join(outDir, outName(base, w, aspect, f)))
    )
  );
}
function pruneMetadata(metadata: FullMetadata, validKeys: Set<string>): FullMetadata {
  const cleaned: FullMetadata = {};
  for (const k of Object.keys(metadata)) {
    const v = (metadata as any)[k];
    const isEntry = v && typeof v === 'object' && 'variants' in v && 'format' in v && 'aspect' in v;
    if (isEntry) {
      if (validKeys.has(k)) cleaned[k] = v;
      else console.log(`🧹 Pruned stale metadata: ${k}`);
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

// ===== Core generation =====
async function processOne(fullPath: string, relKey: string, opts: ScanOptions, metadata: FullMetadata) {
  const stat = fs.statSync(fullPath);
  const dateFolder = getDateFolder(stat.mtime);
  const absOutDir = outputDirFor(dateFolder);

  const img = sharp(fullPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height || !meta.format) return;

  // Choose nearest aspect to source
  const chosenAspect = nearestAspectName(meta.width, meta.height);

  // Base + conditional extras (STRICTLY from config)
  const isAvatar = opts.keyPrefix === 'avatar';
  const isFeatured = opts.featuredAbs ? fullPath.startsWith(opts.featuredAbs) : false;

  const extra: number[] = [];
  if (isAvatar && variants?.avatar) extra.push(variants.avatar);
  if (isFeatured && variants?.featured) extra.push(variants.featured);

  // thumbnail only for avatar/featured when enabled
  if (opts.includeThumbnail && variants?.thumbnail && (isAvatar || isFeatured)) {
    extra.push(variants.thumbnail);
  }

  const widths = uniqSorted([...opts.sizesBase, ...extra]);
  const widthStrings = widths.map(String); // (will use filtered list later)

  // Formats = configured + original
  const originalFmt = String(meta.format).toLowerCase();
  const fmts = Array.from(new Set([...imageFormats, originalFmt]));

  // UPDATED: slugify the output base name
  const baseRaw = path.basename(relKey, path.extname(relKey));
  const relBase = slugifyBaseName(baseRaw);

  // ---------- NEW: build feasible widths (no upscaling) ----------
  function canEmitWidth(w: number): boolean {
    const hNeeded = heightFor(w, chosenAspect);
    return opts.allowUpscale ? true : (meta.width >= w && meta.height >= hNeeded);
  }

  // filter configured widths down to those truly possible
  let feasible = widths.filter(w => canEmitWidth(w));

  // ensure exact source width variant is present (if feasible and not already included)
  const exactW = meta.width;
  if (!feasible.includes(exactW) && canEmitWidth(exactW)) {
    feasible.push(exactW);
    feasible = uniqSorted(feasible);
  }

  const feasibleStrings = feasible.map(String);

  // UPDATED: check on-disk outputs against feasible widths only
  const outputsOk = feasible.length > 0
    ? fileOutputsExistWithAspect(relBase, absOutDir, feasibleStrings, fmts, chosenAspect)
    : true;

  // Decide if regenerate (compare against feasible widths)
  const existing = metadata[relKey] as ImageMetadataEntry | undefined;
  const configTouch = getConfigModified('siteImages');
  const needByConfig  = configTouch > (existing?.lastModified || 0);
  const needByAspect  = existing?.aspect && existing.aspect !== chosenAspect;
  const needByWidths  = existing?.variants ? feasible.some(w => !existing.variants.includes(String(w))) : (feasible.length > 0);
  const needByFormats = existing?.format  ? fmts.some(f => !existing!.format.includes(f)) : true;
  const needByMtime   = !existing || Math.abs((existing.lastModified || 0) - Math.floor(stat.mtimeMs)) > 3 * 60 * 1000;
  const needByFiles   = !outputsOk;

  const mustGenerate = feasible.length > 0 && (needByConfig || needByAspect || needByWidths || needByFormats || needByMtime || needByFiles);

  if (mustGenerate) {
    console.log(`🖼️ Generating: ${relKey} [${chosenAspect}]`);
    for (const w of feasible) {
      const h = heightFor(w, chosenAspect);
      for (const f of fmts) {
        const out = path.join(absOutDir, outName(relBase, w, chosenAspect, f));
        if (fs.existsSync(out)) continue;

        await img
          .clone()
          .resize(w, h, { fit: 'cover', position: 'center' })
          .toFormat(f as keyof sharp.FormatEnum, { quality: compressionLevel })
          .toFile(out);
      }
    }
  } else if (feasible.length === 0) {
    console.warn(`⚠️ No feasible sizes for ${relKey}. Writing metadata only.`);
  } else {
    console.log(`✅ Up-to-date: ${relKey} [${chosenAspect}]`);
  }

  // UPDATED: write feasible sizes (not the original configured list)
  const thumbW = (opts.includeThumbnail && variants?.thumbnail && feasible.includes(variants.thumbnail) && (isAvatar || isFeatured))
    ? String(variants.thumbnail)
    : undefined;

  metadata[relKey] = {
    lastModified: Math.floor(stat.mtimeMs),
    path: `/${dateFolder}/`,
    variants: feasibleStrings,
    format: fmts,
    aspect: chosenAspect,
    ...(thumbW ? { thumbnail: thumbW } : {}),
  };
}

async function scanDir(absDir: string, opts: ScanOptions, metadata: FullMetadata) {
  if (!fs.existsSync(absDir)) return;
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryAbs = path.join(absDir, entry.name);

    // Skip excluded dirs
    if (entry.isDirectory() && opts.excludeAbsDirs?.some(d => entryAbs.startsWith(d))) {
      continue;
    }

    if (entry.isDirectory()) {
      await scanDir(entryAbs, opts, metadata);
      continue;
    }
    if (!/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) continue;

    const rel = path.relative(opts.absRoot, entryAbs).replace(/\\/g, '/');
    const relKey = opts.keyPrefix ? path.posix.join(opts.keyPrefix, rel) : rel;

    opts.collectedKeys.add(relKey);
    await processOne(entryAbs, relKey, opts, metadata);
  }
}

// ===== Main =====
(async () => {
  const metadata = loadMetadata();
  const collectedKeys = new Set<string>();

  const absInput    = path.resolve(inputImageFolder);
  const absAvatar   = path.resolve(avatarFolder);
  const absProfile  = path.resolve(profileFolder);
  const absFeatured = path.resolve(featuredImageFolder);

  // Build BASE sizes strictly from config (no hardcoded defaults)
  const baseConfigured = uniqSorted([
    ...(Array.isArray(imageVariants) ? imageVariants : []),
    variants?.mobile,
    variants?.tablet,
    variants?.desktop,
    variants?.full,
  ]);

  try {
    console.log('🔍 Scanning GENERAL…');
    const exclude: string[] = [];
    if (fs.existsSync(absAvatar))  exclude.push(absAvatar);
    if (fs.existsSync(absProfile)) exclude.push(absProfile);

    await scanDir(absInput, {
      sizesBase: baseConfigured,
      allowUpscale: false,
      keyPrefix: '',
      absRoot: absInput,
      includeThumbnail: !!thumbnailEnabled,
      featuredAbs: absFeatured,
      excludeAbsDirs: exclude,
      collectedKeys,
    }, metadata);

    if (fs.existsSync(absProfile)) {
      console.log('\n🪪 Scanning PROFILE…');
      await scanDir(absProfile, {
        sizesBase: baseConfigured,    // obey config only
        allowUpscale: true,
        keyPrefix: 'profile',
        absRoot: absProfile,
        includeThumbnail: !!thumbnailEnabled, // thumbnail NOT added unless featured/avatar (handled inside)
        featuredAbs: absFeatured,
        collectedKeys,
      }, metadata);
    } else {
      console.log('\nℹ️ Profile folder not found, skipping.');
    }

    if (fs.existsSync(absAvatar)) {
      console.log('\n👤 Scanning AVATAR…');
      await scanDir(absAvatar, {
        sizesBase: baseConfigured,    // obey config only
        allowUpscale: true,
        keyPrefix: 'avatar',
        absRoot: absAvatar,
        includeThumbnail: !!thumbnailEnabled, // thumbnail added for avatars inside processOne
        featuredAbs: absFeatured,
        collectedKeys,
      }, metadata);
    } else {
      console.log('\nℹ️ Avatar folder not found, skipping.');
    }

    // 🧹 Clean & write metadata
    const cleaned = pruneMetadata(metadata, collectedKeys);
    saveMetadata(cleaned);

    updateConfigModified('siteImages', getSiteImagesConfigTime());
    console.log('\n✅ Image generation complete.');
  } catch (err) {
    console.error('❌ Error during image processing:', err);
  }
})();
