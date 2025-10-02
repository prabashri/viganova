// src/utils/getImageVariants.ts
import imageMetadataJson from '../data/image-format-details.json';
import { siteDefaults } from '../config/siteDefaults';
import { siteImages } from '@/config/siteImages';

type ImageFormat = 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif' | string;
type ImageSize = 'avatar' | 'full' | 'desktop' | 'mobile' | 'featured' | 'thumbnail';

export type ImageVariants = {
  [size in ImageSize]?: {
    [format in ImageFormat]?: string;
  };
};

const targetWidths: Record<ImageSize, number> = {
  avatar: siteImages.variants.avatar ?? 80,
  full: siteImages.variants.full ?? 1280,
  desktop: siteImages.variants.desktop ?? 640,
  mobile: siteImages.variants.mobile ?? 320,
  featured: siteImages.variants.featured ?? 960,
  thumbnail: siteImages.variants.thumbnail ?? 120
};

export function getImageVariants(imagePath: string): ImageVariants | null {
  const metadata = imageMetadataJson as Record<string, any>;
  const data = metadata[imagePath];
  if (!data) return null;

  const basePath = `/images${data.path}`;
  const filename = imagePath.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '');
  const aspect = data.aspect;
  const formats: ImageFormat[] = [...data.format].sort((a, b) => (a === 'webp' ? -1 : b === 'webp' ? 1 : 0));
    interface ImageMetadata {
        path: string;
        aspect: number;
        format: ImageFormat[];
        variants: (number | string)[];
    }

    const widths: number[] = (data as ImageMetadata).variants.map(Number).sort((a: number, b: number) => b - a); // Descending

  const variants: ImageVariants = {};

  for (const [size, target] of Object.entries(targetWidths) as [ImageSize, number][]) {
    const width = widths.find(w => w <= target) ?? widths.at(-1);
    if (!width) continue;

    variants[size] = {};
    for (const format of formats) {
      variants[size]![format] = `${basePath}${filename}-w${width}-a${aspect}.${format}`;
    }
  }

  return variants;
}
