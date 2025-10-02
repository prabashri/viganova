// src/types/images.ts
export type ImageFormat = 'avif' | 'webp' | 'png' | 'jpg' | 'jpeg' | string;

export type ImageSizeLabel =
  | 'avatar'
  | 'thumbnail'
  | 'mobile'
  | 'tablet'
  | 'desktop'
  | 'featured'
  | 'full';

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
