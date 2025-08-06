// src/scripts/generate-site-logo.ts
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { siteImages } from '../config/siteImages';

const publicLogosDir = path.resolve('./public/logos');
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

async function copySvg(source: string, targetName: string) {
  try {
    const targetPath = path.join(publicLogosDir, targetName);
    await ensureDir(publicLogosDir);
    await fs.copyFile(path.resolve(source), targetPath);
    return `/logos/${targetName}`;
  } catch {
    console.warn(`⚠️ Missing SVG: ${source}`);
    return null;
  }
}

async function processLogoImage(source: string, baseName: string, width: number) {
  const ext = toExt(source);
  const originalPath = path.join(publicLogosDir, `${baseName}-original${ext}`);
  const resizedPngPath = path.join(publicLogosDir, `${baseName}-${width}w.png`);
  const resizedWebpPath = path.join(publicLogosDir, `${baseName}-${width}w.webp`);
  const resizedAvifPath = path.join(publicLogosDir, `${baseName}-${width}w.avif`);

  try {
    await ensureDir(publicLogosDir);
    const inputBuffer = await fs.readFile(path.resolve(source));

    // Save original
    await fs.writeFile(originalPath, inputBuffer);

    // Save resized PNG
    await sharp(inputBuffer).resize(width).png({ quality: 80 }).toFile(resizedPngPath);

    // Save resized WebP
    await sharp(inputBuffer).resize(width).webp({ quality: 80 }).toFile(resizedWebpPath);

    // Save resized AVIF
    await sharp(inputBuffer).resize(width).avif({ quality: 50 }).toFile(resizedAvifPath);

    return {
      original: `/logos/${baseName}-original${ext}`,
      png: `/logos/${baseName}-${width}w.png`,
      webp: `/logos/${baseName}-${width}w.webp`,
      avif: `/logos/${baseName}-${width}w.avif`
    };
  } catch {
    console.warn(`⚠️ Could not process logo: ${source}`);
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

  // Process desktop logo (300px)
  const desktopLogo = await processLogoImage(siteImages.desktopLogo, 'desktop-logo', 300);

  // Process mobile logo (100px)
  const mobileLogo = await processLogoImage(siteImages.mobileLogo, 'mobile-logo', 100);

  // Process icon logo (100px)
  const iconLogo = await processLogoImage(siteImages.siteIcon, 'icon-logo', 100);

  // Copy SVGs
  const desktopLogoSvg = await copySvg(siteImages.desktopLogoSvg, 'desktop-logo.svg');
  const mobileLogoSvg = await copySvg(siteImages.mobileLogoSvg, 'mobile-logo.svg');
  const iconLogoSvg = await copySvg(siteImages.siteIconSvg, 'icon-logo.svg');
  const favIconSvg = await copySvg(siteImages.favIconSvg, 'favicon.svg');

  // Update manifest
  try {
    const manifest = await getManifest();

    manifest.configModified = {
      ...(manifest.configModified || {}),
      siteImages: Date.now()
    };

    manifest.logosPublic = {
      desktopLogo,
      mobileLogo,
      iconLogo,
      svgs: {
        desktopLogoSvg,
        mobileLogoSvg,
        iconLogoSvg,
        favIconSvg
      }
    };

    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('✅ Logos updated in manifest');
  } catch (err) {
    console.error('❌ Failed to update manifest:', err);
  }
}

main();
