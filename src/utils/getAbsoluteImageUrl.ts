import { siteDefaults } from "../config/siteDefaults";

/**
 * Generates a fully qualified image URL (ensures correct slashes).
 * 
 * @param basePath - Image base path (relative, may or may not start with '/')
 * @param fileName - Full file name (e.g. "image-w1280-a1x1.webp")
 */
export function getAbsoluteImageUrl(basePath: string, fileName: string): string {
  const siteUrl = siteDefaults.siteUrl.replace(/\/$/, ''); // remove trailing slash from siteUrl
  const normalizedBase = basePath.startsWith('/') ? basePath : `/${basePath}`; // ensure leading slash
  return `${siteUrl}${normalizedBase}${fileName}`;
}
