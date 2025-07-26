import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { siteDefaults } from '../config/siteDefaults';
type AssetsManifest = {
  css: Record<string, { file: string; datetime: string }>;
  preload: Record<string, { file: string; datetime: string }>;
  js: Record<string, { file: string; datetime: string }>;
  icons?: Record<string, { datetime: string }>;
  siteDefaults?: { datetime: string };
};

import assetsManifestJson from '../data/assets-manifest.json';
const assetsManifest = assetsManifestJson as unknown as AssetsManifest;

const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'manifest.webmanifest');

const siteDefaultsPath = path.resolve('src/config/siteDefaults.ts');
const recordedSiteDefaultsTime = assetsManifest?.siteDefaults?.datetime;

const iconSizes = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 }
];

// --- Trim utility
const trimTo = (str: string, max: number) =>
  str.length > max ? str.slice(0, max).trim() : str.trim();

// --- Check if file update is needed
function needsUpdate(filePath: string, recordedTime?: string) {
  if (!fs.existsSync(filePath)) return true;
  const stats = fs.statSync(filePath);
  return new Date(stats.mtime).toISOString() !== recordedTime;
}

// --- Resolve favicon source
function resolveFaviconSource(): string | null {
  const favIconPath = path.resolve(siteDefaults.favIconPng ?? '');
  return fs.existsSync(favIconPath) ? favIconPath : null;
}
function getSharpPipelineByFormat(sourcePath: string, size: number) {
  const ext = path.extname(sourcePath).toLowerCase();
  const base = sharp(sourcePath)
    .resize(size, size, { fit: 'cover', position: 'center' });

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return base.jpeg({ quality: 80, progressive: true });
    case '.webp':
      return base.webp({ quality: 80 });
    case '.avif':
      return base.avif({ quality: 60 });
    case '.png':
    default:
      return base.png({ compressionLevel: 9, adaptiveFiltering: true });
  }
}

// --- Generate PNG icons
async function generateIcons(source: string) {
  const meta = await sharp(source).metadata();
  const minDim = Math.min(meta.width ?? 0, meta.height ?? 0);

  for (const { name, size } of iconSizes) {
    const outputPath = path.join(publicDir, name);
    const recordedTime = assetsManifest?.icons?.[name]?.datetime;

    if (needsUpdate(outputPath, recordedTime)) {
      const pipeline = getSharpPipelineByFormat(source, size);
      await pipeline.toFile(outputPath);
      console.log(`✅ Generated ${name}`);
    }
  }
}


// --- Handle favicon.svg
function handleSvgIcon() {
  const svgSrcPath = path.resolve(siteDefaults.favIconSvg ?? '');
  const svgDestPath = path.join(publicDir, 'favicon.svg');

  if (!fs.existsSync(svgSrcPath)) {
    console.warn('⚠️ SVG favicon not found at:', svgSrcPath);
    return;
  }

  if (!fs.existsSync(svgDestPath)) {
    fs.copyFileSync(svgSrcPath, svgDestPath);
    console.log('✅ Copied favicon.svg to public folder');
  }
}

// --- Generate manifest.webmanifest
function writeWebManifest() {
  const manifest = {
    name: trimTo(siteDefaults.siteName ?? 'astroweb-theme', 50),
    short_name: trimTo(siteDefaults.shortName ?? siteDefaults.siteName ?? 'astroweb', 15),
    start_url: '/',
    display: 'standalone',
    background_color: siteDefaults.backgroundColor ?? '#ffffff',
    theme_color: siteDefaults.primaryColor ?? '#0d9488',
    description: trimTo(
      siteDefaults.description ??
        'Minimal, performance-first Astro theme by NViewsWeb.',
      160
    ),
    icons: iconSizes.map(({ name, size }) => ({
      src: `/${name}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: name.includes('apple') ? 'any' : undefined
    }))
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ Web App Manifest generated.');
}

// --- Update assets-manifest.json
function updateAssetsManifest(siteDefaultsTime: string) {
  const updatedIcons: Record<string, { datetime: string }> = {};

  for (const { name } of iconSizes) {
    const iconPath = path.join(publicDir, name);
    if (fs.existsSync(iconPath)) {
      const time = fs.statSync(iconPath).mtime.toISOString();
      updatedIcons[name] = { datetime: time };
    }
  }

  const updated = {
    ...assetsManifest,
    icons: updatedIcons,
    siteDefaults: {
      datetime: siteDefaultsTime
    }
  };

  fs.writeFileSync(
    path.resolve('src/data/assets-manifest.json'),
    JSON.stringify(updated, null, 2)
  );

  console.log('📦 Updated assets-manifest.json (icons + siteDefaults.ts timestamp)');
}


// --- Runner
async function main() {
  if (!fs.existsSync(siteDefaultsPath)) {
    console.error('❌ siteDefaults.ts not found.');
    return;
  }

  const siteDefaultsStats = fs.statSync(siteDefaultsPath);
  const currentSiteDefaultsTime = siteDefaultsStats.mtime.toISOString();

  const isSiteDefaultsChanged =
    !recordedSiteDefaultsTime || currentSiteDefaultsTime !== recordedSiteDefaultsTime;

  const pngSource = resolveFaviconSource();
  if (!pngSource) {
    console.error('❌ PNG favicon source not found.');
    return;
  }

  try {
    let updated = false;

    if (isSiteDefaultsChanged) {
      console.log('🔁 siteDefaults.ts has changed, regenerating manifest...');
      writeWebManifest();
      updated = true;
    }

    await generateIcons(pngSource);
    handleSvgIcon();
    updateAssetsManifest(currentSiteDefaultsTime);

    if (!updated) {
      console.log('✅ No changes in siteDefaults.ts. Icons updated only if required.');
    }
  } catch (err) {
    console.error('❌ Error during manifest generation:', err);
  }
}


main();
