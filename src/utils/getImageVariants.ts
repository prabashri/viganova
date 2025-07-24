import imageMetadataJson from '../data/image-format-details.json';
import { siteDefaults } from '../config/siteDefaults';

type ImageFormat = 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif' | string;
type ImageSize = 'full' | 'desktop' | 'mobile' | 'featured' | 'thumbnail';

export type ImageVariants = {
  [size in ImageSize]?: {
    [format in ImageFormat]?: string;
  };
};

const targetWidths: Record<ImageSize, number> = {
  full: 1280,
  desktop: 640,
  mobile: 320,
  featured: siteDefaults.featuredImageSize ?? 960,
  thumbnail: siteDefaults.thumbnailSize ?? 120
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
