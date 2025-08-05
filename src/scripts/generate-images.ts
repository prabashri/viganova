// src/scripts/generate-images.ts
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { siteImages } from '../config/siteImages';
import { getConfigModified, updateConfigModified } from '../utils/configModified';

interface ImageMetadataEntry {
  lastModified: number;
  path: string;
  variants: string[];
  format: string[];
  aspect: string;
  thumbnail?: string;
}

interface FullMetadata {
  [key: string]: ImageMetadataEntry | number;
}

// ✅ Load constants from siteImages
const {
  imageVariants,
  imageFormats,
  compressionLevel,
  inputImageFolder,
  featuredImageFolder,
  outputImageBase,
  featuredImageSize,
  thumbnail,
  thumbnailSize
} = siteImages;

// ✅ File paths
const metadataFile = path.resolve('./src/data/image-format-details.json');
const siteImagesConfigPath = path.resolve('src/config/siteImages.ts');

// ✅ Tolerance for mtime differences
const toleranceMs = 3 * 60 * 1000; // 3 minutes

// ✅ Aspect ratio mapping
const aspectRatios: Record<string, number> = {
  '1x1': 1,
  '16x9': 16 / 9,
  '9x16': 9 / 16,
  '4x3': 4 / 3,
  '3x4': 3 / 4,
  '4x5': 4 / 5,
  '5x4': 5 / 4,
  '2x3': 2 / 3,
  '3x2': 3 / 2,
  '3x1': 3 / 1,
  '1x3': 1 / 3,
  '2x1': 2 / 1,
  '1x2': 1 / 2
};

// ✅ Helper: Find closest aspect ratio key
function getClosestAspectKey(ratio: number): string {
  return Object.entries(aspectRatios).reduce((closest, [key, value]) =>
    Math.abs(ratio - value) < Math.abs(ratio - aspectRatios[closest])
      ? key
      : closest,
    Object.keys(aspectRatios)[0]
  );
}

// ✅ Helper: Get output folder based on date
function getDateFolder(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ✅ Helper: Get siteImages.ts modified time
function getSiteImagesConfigTime(): number {
  return fs.existsSync(siteImagesConfigPath)
    ? Math.floor(fs.statSync(siteImagesConfigPath).mtimeMs)
    : 0;
}

// ✅ Load metadata from file
function loadMetadata(): FullMetadata {
  try {
    return JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  } catch {
    return {};
  }
}

// ✅ Save metadata (without configModified)
function saveMetadata(data: FullMetadata): void {
  let existingData: Record<string, any> = {};
  try {
    existingData = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
  } catch {
    console.warn('⚠️ No existing metadata found, starting fresh.');
  }

  // Merge new entries
  const mergedData: Record<string, any> = {
    ...existingData,
    ...data
  };

  // Sort image keys alphabetically
  const sortedImages: Record<string, any> = {};
  Object.keys(mergedData)
    .sort()
    .forEach(k => (sortedImages[k] = mergedData[k]));

  fs.mkdirSync(path.dirname(metadataFile), { recursive: true });
  fs.writeFileSync(metadataFile, JSON.stringify(sortedImages, null, 2));

  console.log('📦 Merged and updated image-format-details.json');
}

// ✅ Helper: Check if all output files exist
function allOutputsExist(
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

function shouldRegenerateImage(
  relKey: string,
  stat: fs.Stats,
  meta: sharp.Metadata,
  isFeatured: boolean,
  metadata: FullMetadata
): boolean {
  const existing = metadata[relKey] as ImageMetadataEntry | undefined;
  const currentMtime = Math.floor(stat.mtimeMs);

  // ✅ Compare with configModified.siteImages in assets-manifest.json
  const assetsConfigTime = getConfigModified('siteImages');
  if (assetsConfigTime > 0 && assetsConfigTime > (existing?.lastModified || 0)) {
    return true;
  }

  // No record exists
  if (!existing) return true;

  // mtime tolerance check
  if (Math.abs(currentMtime - existing.lastModified) > toleranceMs) return true;

  // Required widths
  const variantSet = new Set(imageVariants.map(String));
  if (isFeatured) {
    variantSet.add(String(featuredImageSize));
    if (thumbnail) variantSet.add(String(thumbnailSize));
  }
  const requiredWidths = Array.from(variantSet);

  // Variant check
  if (requiredWidths.some(w => !existing.variants.includes(w))) return true;

  // Format check
  const requiredFormats = new Set([...imageFormats, meta.format?.toLowerCase() || 'png']);
  if (Array.from(requiredFormats).some(f => !existing.format.includes(f))) return true;

  // Aspect check
  const aspectKey = getClosestAspectKey((meta.width || 1) / (meta.height || 1));
  if (existing.aspect !== aspectKey) return true;

  // File existence check
  const dateFolder = getDateFolder(stat.mtime);
  if (!allOutputsExist(
    path.basename(relKey, path.extname(relKey)),
    path.join(outputImageBase, dateFolder),
    requiredWidths,
    Array.from(requiredFormats),
    aspectKey
  )) {
    return true;
  }

  return false;
}

// ✅ Process a single image
async function processImage(
  fullPath: string,
  relPath: string,
  metadata: FullMetadata,
  isFeatured: boolean
): Promise<void> {
  const stat = fs.statSync(fullPath);
  const base = path.basename(relPath, path.extname(relPath));
  const img = sharp(fullPath);
  const meta = await img.metadata();
  if (!meta.width || !meta.height || !meta.format) return;

  const aspectKey = getClosestAspectKey(meta.width / meta.height);
  const dateFolder = getDateFolder(stat.mtime);
  const outputDir = path.join(outputImageBase, dateFolder);
  fs.mkdirSync(outputDir, { recursive: true });

  const allFormats = new Set([...imageFormats, meta.format.toLowerCase()]);

  // Variant set
  const variantSet = new Set(imageVariants);
  if (isFeatured) {
    variantSet.add(featuredImageSize);
    if (thumbnail) variantSet.add(thumbnailSize);
  }

  const usedWidths = new Set<string>();

  // Skip if up-to-date
  if (!shouldRegenerateImage(relPath, stat, meta, isFeatured, metadata)) {
    console.log(`✅ Up-to-date: ${relPath}`);
    return;
  }

  console.log(`📸 Processing: ${relPath}`);

  // Generate variants
  for (const width of variantSet) {
    if (width > meta.width) continue;
    const height = Math.round(width / aspectRatios[aspectKey]);

    for (const format of allFormats) {
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `${base}-w${width}-a${aspectKey}.${ext}`;
      const outputPath = path.join(outputDir, filename);

      if (!fs.existsSync(outputPath)) {
        console.log(`🖼️ Generating: ${outputPath}`);
        await img
          .clone()
          .resize(width, height, { fit: 'cover', position: 'center' })
          .toFormat(format as keyof sharp.FormatEnum, { quality: compressionLevel })
          .toFile(outputPath);
      }
    }
    usedWidths.add(String(width));
  }

  // Save metadata
  let finalVariants = new Set(imageVariants);
  if (isFeatured) {
    finalVariants.add(featuredImageSize);
    if (thumbnail) finalVariants.add(thumbnailSize);
  }
  finalVariants = new Set([...finalVariants, ...Array.from(usedWidths).map(Number)]);

  metadata[relPath] = {
    lastModified: Math.floor(stat.mtimeMs),
    path: `/${dateFolder}/`,
    variants: Array.from(finalVariants)
      .map(v => String(v))
      .sort((a, b) => Number(a) - Number(b)),
    format: Array.from(allFormats),
    aspect: aspectKey,
    ...(isFeatured && thumbnail ? { thumbnail: String(thumbnailSize) } : {})
  };
}

// ✅ Scan folder recursively
async function scanFolder(
  dir: string,
  metadata: FullMetadata,
  isFeatured: boolean
): Promise<void> {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(inputImageFolder, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      await scanFolder(fullPath, metadata, isFeatured);
    } else if (/\.(png|jpe?g|webp|avif)$/i.test(entry.name)) {
      await processImage(fullPath, relPath, metadata, isFeatured);
    }
  }
}

// ✅ Main execution
(async () => {
  const metadata = loadMetadata();

  try {
    console.log('🔍 Scanning general images...');
    await scanFolder(inputImageFolder, metadata, false);

    console.log('\n🌟 Scanning featured images...');
    await scanFolder(featuredImageFolder, metadata, true);

    saveMetadata(metadata);

    // ✅ Update configModified in assets-manifest.json
    updateConfigModified('siteImages', getSiteImagesConfigTime());

    console.log('\n✅ Image generation complete.');
  } catch (error) {
    console.error('❌ Error during image processing:', error);
  }
})();
