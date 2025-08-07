// types/imageProps.ts

export type ImageVariant = 'thumbnail' | 'featured' | 'mobile' | 'tablet' | 'desktop' | 'full' | 'auto';

export type ImageFormat = 'avif' | 'webp' | 'png' | 'jpeg' | 'jpg';

export interface ImageVariants {
  thumbnail: number;
  featured: number;
  mobile: number;
  tablet: number;
  desktop: number;
  full: number;
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
