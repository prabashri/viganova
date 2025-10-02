/**
 * Get metadata for an image based on its key.
 * Returns the URL, width, and height of the largest variant.
 * If no metadata is found, returns the default site image.
 * @param imageKey - The key of the image (e.g. "featured/astroweb-modern-website-theme-astro.png")
 * @return An object containing the image URL, width, and height.
 * src/utils/getImageMeta.ts
 * 
 * usage:
 * import { getImageMeta } from 'src/utils/getImageMeta';
 * const imageMeta = getImageMeta('featured/astroweb-modern-website-theme-astro.png');
 * console.log(imageMeta.url, imageMeta.width, imageMeta.height);   
 * @returns {ImageMeta | null} - The image metadata or null if no key is provided.
 * 
 * currently used in baseHead.astro and ResponsiveImage.astro
 */
import imageMetadataJson from '@/data/image-format-details.json';
import { siteDefaults } from '@/config/siteDefaults';
import { siteImages } from '@/config/siteImages';

const DEFAULT_FORMAT_ORDER = ['webp', 'png', 'jpg', 'jpeg', 'avif'];

export interface ImageMeta {
  url: string;
  width: number;
  height: number;
}

/**
 * Get the max size image URL, width, height for an image key or fallback to siteImages.image
 * @param imageKey - Example: "featured/astroweb-modern-website-theme-astro.png"
 */
export function getImageMeta(imageKey?: string): ImageMeta | null {
  // ✅ Use provided image or default from siteImages
  const keyToUse = imageKey || siteImages.image?.replace(/^\//, '');

  if (!keyToUse) {
    return null;
  }

  const metadata = (imageMetadataJson as Record<string, any>)[keyToUse];
  if (!metadata) {
    // ⚠️ No metadata, build fallback basic URL
    return null;
  }

  // ✅ Sort formats (webp > png > jpg > avif)
  const formatsSorted = [...metadata.format].sort(
    (a, b) => DEFAULT_FORMAT_ORDER.indexOf(a) - DEFAULT_FORMAT_ORDER.indexOf(b)
  );

  const format = formatsSorted[0];
  const maxWidth = Math.max(...metadata.variants.map(Number));
  const [aspectW, aspectH] = metadata.aspect.split('x').map(Number);
  const outputImageBase = siteImages.outputImageBase || './public/images';
    const folderPath = outputImageBase.replace(/^\.\/public\//, '');

  const imageBaseName = keyToUse.replace(/^.*[\/]/, '').replace(/\.[^.]+$/, '');
  const basePath = `${folderPath}${metadata.path}`;

  const url = `${siteDefaults.siteUrl.replace(/\/$/, '')}/${basePath}${imageBaseName}-w${maxWidth}-a${metadata.aspect}.${format}`;
  const height = Math.round(maxWidth * (aspectH / aspectW));

  return {
    url,
    width: maxWidth,
    height,
  };
}

