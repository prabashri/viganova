// src/scripts/generate-site-logo.ts
import fs from 'fs/promises';
import fsSync from 'fs'; // for existsSync alongside fs/promises
import path from 'path';
import sharp from 'sharp';
import crypto from 'crypto';
import { siteImages } from '@/config/siteImages';
import { siteDefaults } from '@/config/siteDefaults';

const publicLogosDir = path.resolve('./public/logos');
const iconsPath = path.resolve('./src/icons');
const manifestPath = path.resolve('./src/data/assets-manifest.json');

async function pathExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

function toExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.jpeg' ? '.jpg' : ext;
}
function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function getManifest() {
  try {
    const data = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}
async function saveManifest(m: any) {
  await ensureDir(path.dirname(manifestPath));
  await fs.writeFile(manifestPath, JSON.stringify(m, null, 2), 'utf8');
}

/** resolve repo or public path; remote URLs are ignored */
function resolveLogoSource(p?: string | null): string | null {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return null;
  if (p.startsWith('/')) {
    return path.resolve('./public', p.replace(/^\/+/, ''));
  }
  return path.resolve(p);
}

/**
 * Try to resolve a logo path that may be:
 *  - public absolute:   /logos/foo.png  (→ ./public/logos/foo.png)
 *  - repo relative:     src/assets/logos/foo.png
 *  - bare filename:     foo.png (we try common roots)
 */
async function resolveExistingLogoSource(input?: string | null): Promise<string | null> {
  if (!input) return null;

  // If it's an absolute URL, skip (we only handle local files here)
  if (/^https?:\/\//i.test(input)) return null;

  const candidates: string[] = [];

  if (input.startsWith('/')) {
    // Public-style absolute path
    candidates.push(path.resolve('./public', input.replace(/^\/+/, '')));
    // Also try mapping /logos/*.ext → src/assets/logos/*.ext
    const justName = input.replace(/^\/+logos\/+/, '');
    if (justName && justName !== input) {
      candidates.push(path.resolve('./src/assets/logos', justName));
    }
  } else {
    // Repo-relative given
    candidates.push(path.resolve(input));
  }

  // Common fallbacks if above didn’t exist
  const baseName = input.replace(/^.*[\\/]/, '');
  candidates.push(
    path.resolve('./src/assets', input),                // src/assets/… relative chain
    path.resolve('./src/assets/logos', input),         // src/assets/logos/…
    path.resolve('./src/assets/logos', baseName),      // src/assets/logos/<file>
  );

  for (const cand of candidates) {
    if (fsSync.existsSync(cand)) return cand;
  }

  console.warn('⚠️ Logo file not found. Tried:\n' + candidates.map(c => ' • ' + c).join('\n'));
  return null;
}

/** content fingerprint for change detection */
async function fingerprintFile(abs: string): Promise<string> {
  const buf = await fs.readFile(abs);
  const h = crypto.createHash('sha1').update(buf).digest('hex');
  const stat = await fs.stat(abs);
  return `${abs}:${stat.size}:${stat.mtimeMs}:${h}`;
}

/** delete all files for a given base prefix in /public/logos (e.g., "parent-organization-nviews-") */
async function cleanGroup(basePrefix: string) {
  await ensureDir(publicLogosDir);
  const entries = await fs.readdir(publicLogosDir).catch(() => []);
  await Promise.all(entries.map(async (name) => {
    if (name.startsWith(basePrefix)) {
      try { await fs.rm(path.join(publicLogosDir, name), { force: true }); } catch {}
    }
  }));
}

/**
 * Copy a single SVG to both /public/logos and /src/icons with a supplied base name (no extension).
 * Returns web paths for /public and src paths for /src/icons.
 */
async function copySvgToPublicAndIcons(source: string | undefined, baseNameNoExt: string) {
  if (!source) return { publicPath: null, srcPath: null };
  try {
    await ensureDir(publicLogosDir);
    await ensureDir(iconsPath);

    const srcAbs = await resolveExistingLogoSource(source);
    // const srcAbs = resolveLogoSource(source);
    if (!srcAbs) return { publicPath: null, srcPath: null };

    const filename = `${baseNameNoExt}.svg`;
    const publicTarget = path.join(publicLogosDir, filename);
    const srcIconsTarget = path.join(iconsPath, filename);

    await fs.copyFile(srcAbs, publicTarget);
    await fs.copyFile(srcAbs, srcIconsTarget);

    return {
      publicPath: `/logos/${filename}`,
      srcPath: `src/icons/${filename}`,
    };
  } catch (e) {
    console.warn(`⚠️ Missing or failed to copy SVG: ${source}`, e);
    return { publicPath: null, srcPath: null };
  }
}

/** Save original buffer and produce PNG/WebP/AVIF at given width. */
async function saveOneSize(inputBuffer: Buffer, baseName: string, width: number) {
  const resizedPngPath  = path.join(publicLogosDir, `${baseName}-${width}w.png`);
  const resizedWebpPath = path.join(publicLogosDir, `${baseName}-${width}w.webp`);
  const resizedAvifPath = path.join(publicLogosDir, `${baseName}-${width}w.avif`);

  await sharp(inputBuffer).resize(width).png({ quality: 80 }).toFile(resizedPngPath);
  await sharp(inputBuffer).resize(width).webp({ quality: 80 }).toFile(resizedWebpPath);
  await sharp(inputBuffer).resize(width).avif({ quality: 50 }).toFile(resizedAvifPath);

  return {
    width,
    png:  `/logos/${path.basename(resizedPngPath)}`,
    webp: `/logos/${path.basename(resizedWebpPath)}`,
    avif: `/logos/${path.basename(resizedAvifPath)}`
  };
}

/**
 * Process a logo image to:
 *  - save original (copied as -original.<ext>)
 *  - generate multiple sizes (PNG/WebP/AVIF)
 *  - return a structured record
 */
async function processLogoImageWithSizes(
  source: string | undefined | null,
  baseName: string,
  computeWidths: (metadata: sharp.Metadata) => number[]
) {
  if (!source) return null;
  try {
    await ensureDir(publicLogosDir);

    const srcAbs = await resolveExistingLogoSource(source);
    // const srcAbs = resolveLogoSource(source);
    if (!srcAbs) return null;

    const inputBuffer = await fs.readFile(srcAbs);

    const ext = toExt(srcAbs);
    const originalPath = path.join(publicLogosDir, `${baseName}-original${ext}`);
    await fs.writeFile(originalPath, inputBuffer);

    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const widths = (computeWidths(metadata) || [])
      .map(w => Math.max(1, Math.round(w)))
      .filter((w, i, arr) => Number.isFinite(w) && w > 0 && arr.indexOf(w) === i)
      .sort((a, b) => a - b);

    const variants = [];
    for (const w of widths) {
      variants.push(await saveOneSize(inputBuffer, baseName, w));
    }

    return { original: `/logos/${path.basename(originalPath)}`, variants };
  } catch (e) {
    console.warn(`⚠️ Could not process logo: ${source}`, e);
    return null;
  }
}

/** Check if siteImages.ts changed since last build (for desktop/mobile/icon) */
async function imagesConfigChangedSince(manifest: any): Promise<boolean> {
  try {
    const prev = manifest?.configModified?.siteImages || 0;
    const siteImagesPath = path.resolve('./src/config/siteImages.ts');
    const stat = await fs.stat(siteImagesPath);
    return stat.mtime.getTime() > prev;
  } catch {
    return true;
  }
}

/** Check if parentOrganization.logo changed (path or content) */
async function parentOrgLogoChangedSince(manifest: any): Promise<{ changed: boolean; fingerprint?: string; abs?: string }> {
  const src = await resolveExistingLogoSource(siteDefaults?.parentOrganization?.logo);
  if (!src) return { changed: false };
  try {
    const fp = await fingerprintFile(src);
    const prev = manifest?.sources?.parentOrganizationLogo?.fingerprint || '';
    return { changed: fp !== prev, fingerprint: fp, abs: src };
  } catch {
    return { changed: true };
  }
}

async function main() {
  const manifest = await getManifest();

  // --- decide which groups to rebuild ---
  const needRaster = await imagesConfigChangedSince(manifest);
  const parentCheck = await parentOrgLogoChangedSince(manifest);
  const needParent = parentCheck.changed;

  if (!needRaster && !needParent) {
    console.log('ℹ️ Logos are already up-to-date (no change detected)');
    return;
  }

  await ensureDir(publicLogosDir);

  // =========================
  // Rebuild parentOrganization logo ONLY if it changed
  // =========================
  let parentOrganizationLogo = manifest?.logosPublic?.parentOrganizationLogo ?? null;
  if (needParent) {
    const parentNameSlug = slugify(siteDefaults?.parentOrganization?.name || 'parent-organization');
    const base = `parent-organization-${parentNameSlug}-logo`;
    console.log('🔄 Updating parent organization logo…');
    await cleanGroup(base); // remove only prior parent-org artifacts
    parentOrganizationLogo = await processLogoImageWithSizes(
      siteDefaults?.parentOrganization?.logo,
      base,
      () => [200]
    );
    // also support optional parent org SVG (if you add logoSvg in siteDefaults later)
    const parentOrganizationLogoSvg = await copySvgToPublicAndIcons(
      (siteDefaults as any)?.parentOrganization?.logoSvg,
      `parent-organization-${parentNameSlug}`
    );

    // keep existing svgs object; only patch parent entries
    manifest.logosPublic = manifest.logosPublic || {};
    manifest.logosPublic.parentOrganizationLogo = parentOrganizationLogo;
    manifest.logosPublic.svgs = manifest.logosPublic.svgs || {};
    manifest.logosPublic.svgs.parentOrganizationLogoSvg = parentOrganizationLogoSvg.publicPath;
    manifest.logosPublic.svgs.srcIcons = {
      ...(manifest.logosPublic.svgs.srcIcons || {}),
      parentOrganizationLogoSvg: parentOrganizationLogoSvg.srcPath
    };

    // remember the fingerprint
    manifest.sources = {
      ...(manifest.sources || {}),
      parentOrganizationLogo: {
        path: parentCheck.abs,
        fingerprint: parentCheck.fingerprint
      }
    };
  }

  // =========================
  // Rebuild raster siteImages group if config changed
  // =========================
  let desktopLogo = manifest?.logosPublic?.desktopLogo ?? null;
  let mobileLogo  = manifest?.logosPublic?.mobileLogo ?? null;
  let iconLogo    = manifest?.logosPublic?.iconLogo ?? null;
  let desktopLogoSvg = { publicPath: manifest?.logosPublic?.svgs?.desktopLogoSvg ?? null, srcPath: manifest?.logosPublic?.svgs?.srcIcons?.desktopLogoSvg ?? null };
  let mobileLogoSvg  = { publicPath: manifest?.logosPublic?.svgs?.mobileLogoSvg  ?? null, srcPath: manifest?.logosPublic?.svgs?.srcIcons?.mobileLogoSvg  ?? null };
  let iconLogoSvg    = { publicPath: manifest?.logosPublic?.svgs?.iconLogoSvg    ?? null, srcPath: manifest?.logosPublic?.svgs?.srcIcons?.iconLogoSvg    ?? null };
  let favIconSvg     = { publicPath: manifest?.logosPublic?.svgs?.favIconSvg     ?? null, srcPath: manifest?.logosPublic?.svgs?.srcIcons?.favIconSvg     ?? null };

  if (needRaster) {
    console.log('🔄 Updating desktop/mobile/icon logos…');
    // Clean only the groups we’re about to rebuild
    await cleanGroup('desktop-logo');
    await cleanGroup('mobile-logo');
    await cleanGroup('icon-logo');

    // Raster: desktop (orig/4, orig/2)
    desktopLogo = await processLogoImageWithSizes(
      siteImages.desktopLogo,
      'desktop-logo',
      (meta) => {
        const w = meta.width ?? 0;
        return [w / 4, w / 2];
      }
    );

    // Raster: mobile (~100, ~200)
    mobileLogo = await processLogoImageWithSizes(
      siteImages.mobileLogo,
      'mobile-logo',
      (meta) => {
        const w = meta.width ?? 0;
        return [Math.min(100, w || 100), Math.min(200, w || 200)];
      }
    );

    // Raster: icon (~100)
    iconLogo = await processLogoImageWithSizes(
      siteImages.siteIcon,
      'icon-logo',
      () => [100]
    );

    // SVG copies
    desktopLogoSvg = await copySvgToPublicAndIcons(siteImages.desktopLogoSvg, 'desktoplogo');
    mobileLogoSvg  = await copySvgToPublicAndIcons(siteImages.mobileLogoSvg,  'mobilelogo');
    iconLogoSvg    = await copySvgToPublicAndIcons(siteImages.siteIconSvg,    'icon-logo');
    favIconSvg     = await copySvgToPublicAndIcons(siteImages.favIconSvg,     'favicon');

    // stamp siteImages config time
    const siteImagesPath = path.resolve('./src/config/siteImages.ts');
    const stat = await fs.stat(siteImagesPath);
    manifest.configModified = {
      ...(manifest.configModified || {}),
      siteImages: stat.mtime.getTime()
    };
  }

  // --- write back to manifest (non-destructive merge) ---
  manifest.logosPublic = {
    ...(manifest.logosPublic || {}),
    desktopLogo,
    mobileLogo,
    iconLogo,
    parentOrganizationLogo,
    svgs: {
      ...(manifest.logosPublic?.svgs || {}),
      desktopLogoSvg: needRaster ? desktopLogoSvg.publicPath : (manifest.logosPublic?.svgs?.desktopLogoSvg ?? null),
      mobileLogoSvg:  needRaster ? mobileLogoSvg.publicPath  : (manifest.logosPublic?.svgs?.mobileLogoSvg  ?? null),
      iconLogoSvg:    needRaster ? iconLogoSvg.publicPath    : (manifest.logosPublic?.svgs?.iconLogoSvg    ?? null),
      favIconSvg:     needRaster ? favIconSvg.publicPath     : (manifest.logosPublic?.svgs?.favIconSvg     ?? null),
      srcIcons: {
        ...(manifest.logosPublic?.svgs?.srcIcons || {}),
        ...(needRaster ? {
          desktopLogoSvg: desktopLogoSvg.srcPath,
          mobileLogoSvg:  mobileLogoSvg.srcPath,
          iconLogoSvg:    iconLogoSvg.srcPath,
          favIconSvg:     favIconSvg.srcPath
        } : {})
      }
    }
  };

  await saveManifest(manifest);
  console.log('✅ Logos manifest updated');
}

main().catch(err => {
  console.error('❌ Logo generation failed:', err);
});
