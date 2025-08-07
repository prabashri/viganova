import { siteDefaults } from "../config/siteDefaults";

/**
 * Converts a given path or URL into an absolute URL using siteDefaults.siteUrl.
 * Ensures consistent protocol and host.
 * 
 * @param pathOrUrl - Relative path or absolute URL
 * @returns Fully qualified absolute URL
 */
export function toAbsoluteUrl(pathOrUrl: string): string {
  const siteBase = siteDefaults.siteUrl.replace(/\/$/, '');
  try {    
    const base = new URL(siteBase);
    const incoming = new URL(pathOrUrl, siteBase);

    // Force correct protocol and host
    incoming.protocol = base.protocol;
    incoming.host = base.host;

    return incoming.toString();
  } catch {
    // Fallback for malformed input
    return `${siteBase}/${pathOrUrl.replace(/^\/+/, '')}`;
  }
}
