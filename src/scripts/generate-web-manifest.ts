// src/scripts/generate-web-manifest.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { encode as encodeIco } from 'sharp-ico';

import { siteImages } from '../config/siteImages';
import { siteColors } from '../config/siteColors';
import { siteDefaults } from '../config/siteDefaults';
import { getConfigModified, updateConfigModified } from '../utils/configModified';

type AssetsManifest = {
  icons?: Record<string, { datetime: string }>;
};

import assetsManifestJson from '../data/assets-manifest.json';
const assetsManifest = assetsManifestJson as unknown as AssetsManifest;

// --- Paths
const publicDir = path.resolve('public');
const manifestPath = path.join(publicDir, 'manifest.webmanifest');
const siteDefaultsPath = path.resolve('src/config/siteDefaults.ts');
const siteImagesPath = path.resolve('src/config/siteImages.ts');
const siteColorsPath = path.resolve('src/config/siteColors.ts');

const iconSizes = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 }
];

// --- Utility: Trim text
const trimTo = (str: string, max: number) =>
  str.length > max ? str.slice(0, max).trim() : str.trim();

// --- Utility: Get mtime of a file
function getMTime(filePath: string): number {
  return fs.existsSync(filePath) ? Math.floor(fs.statSync(filePath).mtimeMs) : 0;
}

// --- Utility: Resolve favicon source
function resolveFaviconSource(): string | null {
  const favIconPath = path.resolve(siteImages.favIcon ?? '');
  return fs.existsSync(favIconPath) ? favIconPath : null;
}

// --- Utility: Get sharp pipeline
function getSharpPipelineByFormat(sourcePath: string, size: number) {
  const ext = path.extname(sourcePath).toLowerCase();
  const base = sharp(sourcePath).resize(size, size, { fit: 'cover', position: 'center' });

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
  for (const { name, size } of iconSizes) {
    const outputPath = path.join(publicDir, name);
    const recordedTime = assetsManifest?.icons?.[name]?.datetime;
    const srcMTime = fs.statSync(source).mtime.toISOString();

    if (!fs.existsSync(outputPath) || srcMTime !== recordedTime) {
      try {
        const pipeline = getSharpPipelineByFormat(source, size);
        await pipeline.toFile(outputPath);

        console.log(`✅ Generated ${name}`);

        if (!assetsManifest.icons) assetsManifest.icons = {};
        assetsManifest.icons[name] = { datetime: srcMTime };
      } catch (err) {
        console.error(`❌ Error generating ${name}:`, err);
      }
    } else {
      console.log(`⏩ Skipped ${name} (no change)`);
    }
  }
}


// --- Handle favicon.svg
function handleSvgIcon() {
  const svgSrcPath = path.resolve(siteImages.favIconSvg ?? '');
  const svgDestPath = path.join(publicDir, 'favicon.svg');

  if (!fs.existsSync(svgSrcPath)) {
    console.warn('⚠️ SVG favicon not found at:', svgSrcPath);
    return;
  }

  const srcMTime = fs.statSync(svgSrcPath).mtime.toISOString();
  if (!fs.existsSync(svgDestPath) ||
    assetsManifest?.icons?.['favicon.svg']?.datetime !== srcMTime) {
    fs.copyFileSync(svgSrcPath, svgDestPath);
    console.log('✅ Copied favicon.svg to public folder');
    if (!assetsManifest.icons) assetsManifest.icons = {};
    assetsManifest.icons['favicon.svg'] = { datetime: srcMTime };
  } else {
    console.log('⏩ Skipped favicon.svg (no change)');
  }
}

// --- Generate manifest.webmanifest
function writeWebManifest() {
  const manifest = {
    name: trimTo(siteDefaults.siteName ?? 'astroweb-theme', 50),
    short_name: trimTo(siteDefaults.shortName ?? siteDefaults.siteName ?? 'astroweb', 15),
    start_url: '/',
    display: 'standalone',
    background_color: siteColors.backgroundColor ?? '#ffffff',
    theme_color: siteColors.primaryColor ?? '#0d9488',
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

  if (!assetsManifest.icons) assetsManifest.icons = {};
  assetsManifest.icons['manifest.webmanifest'] = {
    datetime: new Date().toISOString()
  };
}

// --- Generate favicon.ico
async function generateFaviconIco(source: string) {
  const icoPath = path.join(publicDir, 'favicon.ico');
  const srcMTime = fs.statSync(source).mtime.toISOString();
  const recordedTime = assetsManifest?.icons?.['favicon.ico']?.datetime;

  if (!fs.existsSync(icoPath) || srcMTime !== recordedTime) {
    const pngBuffer = await sharp(source)
      .resize(64, 64, { fit: 'cover', position: 'center' })
      .png({ compressionLevel: 9 })
      .toBuffer();

    const icoBuffer = await encodeIco([pngBuffer]);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('✅ Generated favicon.ico');

    if (!assetsManifest.icons) assetsManifest.icons = {};
    assetsManifest.icons['favicon.ico'] = { datetime: srcMTime };
  } else {
    console.log('⏩ Skipped favicon.ico (no change)');
  }
}

// --- Main runner
(async () => {
  // Get config mtimes
  const siteDefaultsTime = getMTime(siteDefaultsPath);
  const siteImagesTime = getMTime(siteImagesPath);
  const siteColorsTime = getMTime(siteColorsPath);

  const pngSource = resolveFaviconSource();
  if (!pngSource) {
    console.error('❌ PNG favicon source not found.');
    return;
  }

  try {
    const configChanged =
      siteDefaultsTime > getConfigModified('siteDefaults') ||
      siteImagesTime > getConfigModified('siteImages') ||
      siteColorsTime > getConfigModified('siteColors');

    if (configChanged) {
      console.log('🔁 Config changed, regenerating manifest & icons...');
      writeWebManifest();
      await generateIcons(pngSource);
      handleSvgIcon();
      await generateFaviconIco(pngSource);

      // ✅ Update configModified times
      updateConfigModified('siteDefaults', siteDefaultsTime);
      updateConfigModified('siteImages', siteImagesTime);
      updateConfigModified('siteColors', siteColorsTime);

    } else {
      console.log('✅ No config changes detected. Checking icons individually...');
      await generateIcons(pngSource);
      handleSvgIcon();
      await generateFaviconIco(pngSource);
    }

    // --- Merge icons safely without overwriting other keys
    const manifestPathFull = path.resolve('src/data/assets-manifest.json');
    let existingManifest: Record<string, any> = {};
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPathFull, 'utf-8'));
    } catch {
      console.warn('⚠️ Could not parse existing assets-manifest.json. Starting fresh.');
    }

    const sortedIcons: Record<string, { datetime: string }> = {};
    if (assetsManifest.icons) {
      Object.keys(assetsManifest.icons)
        .sort()
        .forEach(k => sortedIcons[k] = assetsManifest.icons![k]);
    }

    const finalManifest = {
      ...existingManifest,
      icons: {
        ...(existingManifest.icons || {}),
        ...sortedIcons
      }
    };

    fs.writeFileSync(manifestPathFull, JSON.stringify(finalManifest, null, 2));
    console.log('📦 Merged and updated assets-manifest.json');

  } catch (err) {
    console.error('❌ Error during manifest generation:', err);
  }
})();

