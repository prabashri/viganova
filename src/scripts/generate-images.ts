// src/scripts/generate-images.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { siteDefaults } from '../config/siteDefaults';

interface ImageMetadataEntry {
  lastModified: number;
  path: string;
  variants: string[];
  format: string[];
  aspect: string;
  thumbnail?: string; // only present for featured images
}

type ImageMetadata = Record<string, ImageMetadataEntry>;

const {
  imageVariants = [320, 640, 960, 1280],
  imageFormats = ['webp', 'avif'],
  compressionLevel = 80,
  inputImageFolder = './src/assets/images',
  featuredImageFolder = './src/assets/featured',
  outputImageBase = './public/images',
  featuredImageSize = 960,
  thumbnail = true,
  thumbnailSize = 120,
} = siteDefaults;

const metadataFile = './src/data/image-format-details.json';
const toleranceMs = 2 * 60 * 1000;

const aspectRatios: Record<string, number> = {
  '1x1': 1, '16x9': 16 / 9, '9x16': 9 / 16,
  '4x3': 4 / 3, '3x4': 3 / 4, '4x5': 4 / 5,
  '5x4': 5 / 4, '2x3': 2 / 3, '3x2': 3 / 2,
  '3x1': 3 / 1, '1x3': 1 / 3, '2x1': 2 / 1, '1x2': 1 / 2,
};

function getClosestAspectKey(ratio: number): string {
  let min = Infinity;
  let key = '';
  for (const [k, v] of Object.entries(aspectRatios)) {
    const diff = Math.abs(ratio - v);
    if (diff < min) {
      min = diff;
      key = k;
    }
  }
  return key;
}

function getDateFolder(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function loadMetadata(): ImageMetadata {
  try {
    return JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  } catch {
    return {};
  }
}

function saveMetadata(data: ImageMetadata): void {
  fs.mkdirSync(path.dirname(metadataFile), { recursive: true });
  fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
}

async function processImage(
  fullPath: string,
  relPath: string,
  metadata: ImageMetadata,
  isFeatured: boolean
): Promise<void> {
  const stat = fs.statSync(fullPath);
  const lastModified = stat.mtimeMs;

  const base = path.basename(relPath, path.extname(relPath));
  const img = sharp(fullPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height || !meta.format) return;

  const aspectKey = getClosestAspectKey(meta.width / meta.height);
  const dateFolder = getDateFolder(stat.mtime);
  const outputDir = path.join(outputImageBase, dateFolder);
  fs.mkdirSync(outputDir, { recursive: true });

  const originalFormat = meta.format.toLowerCase();
  const allFormats = new Set([...imageFormats, originalFormat]);

  const variantSet = new Set(imageVariants);
  if (isFeatured) variantSet.add(featuredImageSize);

  const usedWidths = new Set<string>();

  // ✅ Check image integrity – do all expected output files exist?
  function checkOutputFilesExist(
    base: string,
    outputDir: string,
    widths: string[],
    formats: string[],
    aspect: string
  ): boolean {
    return widths.every(width =>
      formats.every(format => {
        const ext = format === 'jpeg' ? 'jpg' : format;
        const filename = `${base}-w${width}-a${aspect}.${ext}`;
        const outputPath = path.join(outputDir, filename);
        return fs.existsSync(outputPath);
      })
    );
  }


  const existing = metadata[relPath];
  const allWidthsToCheck = new Set([
    ...imageVariants.map(String),
    ...(isFeatured && thumbnail ? [String(thumbnailSize)] : [])
  ]);

  const shouldRegenerate =
    !existing ||
    Math.abs(lastModified - existing.lastModified) > toleranceMs ||
    Array.from(allWidthsToCheck).some(v => !existing?.variants?.includes(v)) ||
    Array.from(allFormats).some(f => !existing?.format?.includes(f)) ||
    existing.aspect !== aspectKey ||
    !checkOutputFilesExist(base, outputDir, Array.from(allWidthsToCheck), Array.from(allFormats), aspectKey);

  if (!shouldRegenerate) {
    console.log(`✅ Up-to-date: ${relPath}`);
    return;
  }

  console.log(`📸 Processing: ${relPath}`);

  // Generate main image variants
  for (const width of Array.from(variantSet)) {
    if (width > meta.width) continue;
    const height = Math.round(width / aspectRatios[aspectKey]);

    for (const format of allFormats) {
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `${base}-w${width}-a${aspectKey}.${ext}`;
      const outputPath = path.join(outputDir, filename);

      if (!fs.existsSync(outputPath)) {
        console.log(`🖼️  Generating: ${outputPath}`);
        await img
          .clone()
          .resize(width, height, { fit: 'cover', position: 'center' })
          .toFormat(format as keyof sharp.FormatEnum, { quality: compressionLevel })
          .toFile(outputPath);
      } else {
        console.log(`✔️  Exists: ${filename}`);
      }
    }

    usedWidths.add(String(width));
  }

  // ✅ Generate thumbnail as standard width variant (same naming as others)
  if (isFeatured && thumbnail && !usedWidths.has(String(thumbnailSize)) && thumbnailSize <= meta.width) {
    const thumbHeight = Math.round(thumbnailSize / aspectRatios[aspectKey]);

    for (const format of allFormats) {
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `${base}-w${thumbnailSize}-a${aspectKey}.${ext}`;
      const outputPath = path.join(outputDir, filename);

      if (!fs.existsSync(outputPath)) {
        console.log(`🖼️  Generating thumbnail variant: ${outputPath}`);
        await img
          .clone()
          .resize(thumbnailSize, thumbHeight, { fit: 'cover', position: 'center' })
          .toFormat(format as keyof sharp.FormatEnum, { quality: compressionLevel })
          .toFile(outputPath);
      } else {
        console.log(`✔️  Thumbnail variant exists: ${filename}`);
      }
    }

    usedWidths.add(String(thumbnailSize)); // ✅ track it with other variants
  }

  // ✅ Save metadata
  metadata[relPath] = {
    lastModified,
    path: `/${dateFolder}/`,
    variants: Array.from(usedWidths),
    format: Array.from(allFormats),
    aspect: aspectKey,
    ...(isFeatured && thumbnail ? { thumbnail: String(thumbnailSize) } : {}),
  };
}

async function scanFolder(
  dir: string,
  metadata: ImageMetadata,
  isFeatured: boolean
): Promise<void> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(isFeatured ? featuredImageFolder : inputImageFolder, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      await scanFolder(fullPath, metadata, isFeatured);
    } else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      await processImage(fullPath, relPath, metadata, isFeatured);
    }
  }
}

(async () => {
  const metadata = loadMetadata();

  try {
    console.log('🔍 Scanning general images...');
    await scanFolder(inputImageFolder, metadata, false);

    console.log('\n🌟 Scanning featured images...');
    await scanFolder(featuredImageFolder, metadata, true);

    saveMetadata(metadata);
    console.log('\n✅ Image generation complete.');
  } catch (error) {
    console.error('❌ Error during image processing:', error);
  }
})();
