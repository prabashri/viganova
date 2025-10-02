// types/imageProps.ts

export type ImageVariant = 
| 'avatar' 
| 'thumbnail' 
| 'featured' 
| 'mobile' 
| 'tablet' 
| 'desktop' 
| 'full';

export type ImageFormat = 'avif' | 'webp' | 'png' | 'jpeg' | 'jpg';

export interface ImageVariants {
  avatar: number;
  thumbnail: number;
  featured: number;
  mobile: number;
  tablet: number;
  desktop: number;
  full: number;
}

export interface ImageMetaSlim {
  /** e.g. "images/2025/08/hero-name" (no suffix, no domain) */
  path: string;
  /** e.g. ["120","380","640","960","1280"] */
  sizes: string[];
  /** e.g. ["avif","webp","png"] */
  formats: string[];
  /** e.g. "16x9" | "1x1" | "4x3" */
  aspect: string;
}

export interface ImageBreakpoints {
  mobileMax: number;
  tabletMax: number;
  desktopMin: number;
  fullMin: number;
}

export interface ImageConfig {
  image: string;
  imageAlt: string;
  imageTitle: string;
  imageVariants: number[];
  imageFormats: ImageFormat[];
  compressionLevel: number;
  outputImageBase: string;
  inputImageFolder: string;
  featuredImageFolder: string;
  featuredImageSize: number;
  breakpoints: ImageBreakpoints;
  thumbnail: boolean;
  thumbnailSize: number;
}
