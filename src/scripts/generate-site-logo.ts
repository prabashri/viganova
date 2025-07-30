import fs from 'fs/promises';
import path from 'path';
import { siteLogo } from '../config/siteLogo';
import { readManifest } from '../utils/write-manifest';

const iconsDir = path.resolve('./src/icons');
const configPath = path.resolve('./src/config/siteLogo.ts');
const manifestPath = path.resolve('./src/data/assets-manifest.json');

async function logosChangedSinceLastBuild(): Promise<boolean> {
  try {
    const manifestContent = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    const manifestEntry = manifest?.logos;

    const logoStat = await fs.stat(configPath);
    if (!manifestEntry?.datetime) return true;

    const manifestTime = new Date(manifestEntry.datetime).getTime();
    const fileTime = logoStat.mtime.getTime();
    return fileTime > manifestTime;
  } catch {
    return true;
  }
}

async function cleanOldIcons() {
  try {
    const files = await fs.readdir(iconsDir);
    const oldIcons = files.filter(f => f.match(/^(DesktopLogo|MobileLogo|SiteIcon)\.svg$/i));
    await Promise.all(oldIcons.map(file => fs.unlink(path.join(iconsDir, file))));
    console.log(`🧹 Removed old SVG icons: ${oldIcons.join(', ')}`);
  } catch {
    // No icons folder, ignore
  }
}

async function copySvgIfExists(source: string, targetName: string) {
  const sourcePath = path.resolve(source);
  const targetPath = path.join(iconsDir, targetName);

  try {
    await fs.access(sourcePath);
    await fs.mkdir(iconsDir, { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
    return `/src/icons/${targetName}`;
  } catch {
    console.warn(`⚠️ Missing SVG file: ${sourcePath}`);
    return null;
  }
}

async function main() {
  const shouldRebuild = await logosChangedSinceLastBuild();
  if (!shouldRebuild) {
    console.log('ℹ️ Logos are already up-to-date (no change detected)');
    return;
  }

  console.log('🔄 Updating site SVG logos...');

  // 🧹 Clean old SVGs
  await cleanOldIcons();

  // Copy SVGs only
  const desktopLogoSvg = await copySvgIfExists(siteLogo.desktopLogoSvg, 'DesktopLogo.svg');
  const mobileLogoSvg = await copySvgIfExists(siteLogo.mobileLogoSvg, 'MobileLogo.svg');
  const siteIconSvg = await copySvgIfExists(siteLogo.siteIconSvg, 'SiteIcon.svg');

  // Update manifest
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  manifest.logos = {
    file: '/src/icons/',
    datetime: new Date().toISOString(),
    files: {
      desktopLogoSvg,
      mobileLogoSvg,
      siteIconSvg
    }
  };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('✅ SVG logos updated, old icons cleaned, and manifest refreshed');
}

main();
