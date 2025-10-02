// src/scripts/generate-site-logo.ts
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { siteImages } from '@/config/siteImages';
import { siteDefaults } from '@/config/siteDefaults';

const publicLogosDir = path.resolve('./public/logos');
const iconsPath = path.resolve('./src/icons');
const manifestPath = path.resolve('./src/data/assets-manifest.json');

function toExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  return ext === '.jpeg' ? '.jpg' : ext;
}

async function getManifest() {
  try {
    const data = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function logosChangedSinceLastBuild(): Promise<boolean> {
  try {
    const manifest = await getManifest();
    const manifestTime = manifest?.configModified?.siteImages || 0;
    const siteImagesPath = path.resolve('./src/config/siteImages.ts');
    const stat = await fs.stat(siteImagesPath);
    const fileTime = stat.mtime.getTime();
    return fileTime > manifestTime;
  } catch {
    return true;
  }
}

async function cleanOldPublicLogos() {
  try {
    await fs.rm(publicLogosDir, { recursive: true, force: true });
    console.log(`🧹 Removed old public logos`);
  } catch {}
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Copy a single SVG to both /public/logos and /src/icons with a supplied base name (no extension).
 * Returns web paths for /public and src paths for /src/icons.
 */
async function copySvgToPublicAndIcons(source: string, baseNameNoExt: string) {
  if (!source) return { publicPath: null, srcPath: null };
  try {
    await ensureDir(publicLogosDir);
    await ensureDir(iconsPath);

    const filename = `${baseNameNoExt}.svg`;

    const srcAbs = path.resolve(source);
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

/**
 * Save original buffer and produce PNG/WebP/AVIF at given width.
 */
async function saveOneSize(
  inputBuffer: Buffer,
  baseName: string,
  width: number
) {
  const resizedPngPath = path.join(publicLogosDir, `${baseName}-${width}w.png`);
  const resizedWebpPath = path.join(publicLogosDir, `${baseName}-${width}w.webp`);
  const resizedAvifPath = path.join(publicLogosDir, `${baseName}-${width}w.avif`);

  await sharp(inputBuffer).resize(width).png({ quality: 80 }).toFile(resizedPngPath);
  await sharp(inputBuffer).resize(width).webp({ quality: 80 }).toFile(resizedWebpPath);
  await sharp(inputBuffer).resize(width).avif({ quality: 50 }).toFile(resizedAvifPath);

  return {
    width,
    png: `/logos/${path.basename(resizedPngPath)}`,
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
  source: string,
  baseName: string,
  computeWidths: (metadata: sharp.Metadata) => number[]
) {
  if (!source) return null;

  try {
    await ensureDir(publicLogosDir);

    const srcAbs = path.resolve(source);
    const inputBuffer = await fs.readFile(srcAbs);

    // Save original (as uploaded) to /public/logos
    const ext = toExt(source);
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

    return {
      original: `/logos/${path.basename(originalPath)}`,
      variants
    };
  } catch (e) {
    console.warn(`⚠️ Could not process logo: ${source}`, e);
    return null;
  }
}

async function main() {
  const shouldRebuild = await logosChangedSinceLastBuild();
  if (!shouldRebuild) {
    console.log('ℹ️ Logos are already up-to-date (no change detected)');
    return;
  }

  console.log('🔄 Updating site logos...');
  await cleanOldPublicLogos();

  // === Raster: DESKTOP LOGO ===
  // widths: original/4 (main), original/2 (2x)
  const desktopLogo = await processLogoImageWithSizes(
    siteImages.desktopLogo,
    'desktop-logo',
    (meta) => {
      const w = meta.width ?? 0;
      const main = w / 4;
      const twoX = w / 2;
      return [main, twoX];
    }
  );

  // === Raster: MOBILE LOGO ===
  // widths: ~100 (main), ~200 (2x) but capped by original width
  const mobileLogo = await processLogoImageWithSizes(
    siteImages.mobileLogo,
    'mobile-logo',
    (meta) => {
      const w = meta.width ?? 0;
      const main = Math.min(100, w || 100);
      const twoX = Math.min(200, w || 200);
      // ensure unique and ascending handled in processor
      return [main, twoX];
    }
  );

  // === Raster: ICON LOGO (kept at ~100 like before) ===
  const iconLogo = await processLogoImageWithSizes(
    siteImages.siteIcon,
    'icon-logo',
    () => [100]
  );

  // ===Raster: Organization Logo is the parent organization logo (kept at ~100 like before) ===
  
  const parentOrganizationLogo = await processLogoImageWithSizes(
    siteDefaults.parentOrganization.logo,
    `organization-${siteDefaults.parentOrganization.name.replace(/\s+/g, '-').toLowerCase()}-logo`,
    () => [200]
  );

  // === SVGs: copy to /public/logos AND /src/icons with required names ===
  const desktopLogoSvg = await copySvgToPublicAndIcons(siteImages.desktopLogoSvg, 'desktoplogo');
  const mobileLogoSvg  = await copySvgToPublicAndIcons(siteImages.mobileLogoSvg,  'mobilelogo');

  // Keep existing behavior for these (or rename like above if you prefer)
  const iconLogoSvg = await copySvgToPublicAndIcons(siteImages.siteIconSvg, 'icon-logo');
  const favIconSvg  = await copySvgToPublicAndIcons(siteImages.favIconSvg,   'favicon');

  // Update manifest
  try {
    const manifest = await getManifest();

    manifest.configModified = {
      ...(manifest.configModified || {}),
      siteImages: Date.now()
    };

    manifest.logosPublic = {
      desktopLogo, // { original, variants: [ {width,png,webp,avif}, ... ] }
      mobileLogo,
      iconLogo,
      parentOrganizationLogo,
      svgs: {
        // public paths:
        desktopLogoSvg: desktopLogoSvg.publicPath,
        mobileLogoSvg:  mobileLogoSvg.publicPath,
        iconLogoSvg:    iconLogoSvg.publicPath,
        favIconSvg:     favIconSvg.publicPath,
        // src/icon paths for convenience:
        srcIcons: {
          desktopLogoSvg: desktopLogoSvg.srcPath,
          mobileLogoSvg:  mobileLogoSvg.srcPath,
          iconLogoSvg:    iconLogoSvg.srcPath,
          favIconSvg:     favIconSvg.srcPath,
        }
      }
    };

    await ensureDir(path.dirname(manifestPath));
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('✅ Logos updated in manifest');
  } catch (err) {
    console.error('❌ Failed to update manifest:', err);
  }
}

main();
