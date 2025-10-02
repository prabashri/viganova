// src/utils/toAbsoluteurl.ts
import { siteDefaults } from "@/config/siteDefaults";

/** Root origin derived from siteDefaults.siteUrl */
const ORIGIN = (() => {
  const base = (siteDefaults.siteUrl || "https://example.com").trim();
  const u = new URL(base);
  u.pathname = "/";        // normalize to root
  u.search = "";
  u.hash = "";
  return u;
})();

/** Remove common tracking params */
function stripTracking(u: URL) {
  ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","fbclid","ref"]
    .forEach(k => u.searchParams.delete(k));
}

/** Is this path clearly a file/asset (has an extension)? */
function isAssetPath(pathname: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(pathname);
}

/** Ensure trailing slash for page-like paths (not files/assets) */
function ensureTrailingSlash(u: URL) {
  if (!isAssetPath(u.pathname) && !u.pathname.endsWith("/")) {
    u.pathname = `${u.pathname}/`;
  }
}

/** Normalize slashes and collapse // (while preserving protocol) */
function normalizePathLike(input: string): string {
  // Convert backslashes to forward slashes
  let s = input.replace(/\\/g, "/");

  // Keep protocol if present, then collapse duplicate slashes in the path part
  // e.g. https://host//a///b -> https://host/a/b
  const m = s.match(/^([a-z]+:\/\/)(.*)$/i);
  if (m) {
    const [, proto, rest] = m;
    return proto + rest.replace(/\/{2,}/g, "/");
  }
  // For non-protocol paths, just collapse
  return s.replace(/\/{2,}/g, "/");
}

/**
 * Convert a path/URL into an absolute URL on the same origin when internal.
 * - Keeps external hosts intact (just strips tracking).
 * - Normalizes backslashes.
 * - Adds trailing slash for page-like paths (no file extension).
 * - Clears hash (so IDs generated via idFor remain stable).
 */
export function toAbsoluteUrl(href?: string): string {
  if (!href) return ORIGIN.toString();

  // Normalize slashes/backslashes early
  const raw = normalizePathLike(href.trim());

  try {
    // Protocol-relative (//cdn.example.com/x)
    if (/^\/\//.test(raw)) {
      const asAbs = new URL(`${ORIGIN.protocol}${raw}`);
      stripTracking(asAbs);
      // External: keep as-is; don't force trailing slash for assets
      if (asAbs.host !== ORIGIN.host) {
        asAbs.hash = "";
        return asAbs.toString();
      }
      // Internal host: ensure trailing slash for page-like URLs
      if (!isAssetPath(asAbs.pathname)) ensureTrailingSlash(asAbs);
      asAbs.hash = "";
      return asAbs.toString();
    }

    // Absolute URL?
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) {
      const abs = new URL(raw);
      stripTracking(abs);
      // External host: return as-is (just cleaned)
      if (abs.host !== ORIGIN.host) {
        abs.hash = "";
        return abs.toString();
      }
      // Internal absolute: normalize trailing slash for pages
      if (!isAssetPath(abs.pathname)) ensureTrailingSlash(abs);
      abs.hash = "";
      return abs.toString();
    }

    // Hash-only or query-only references: resolve against ORIGIN
    const resolved = new URL(raw, ORIGIN);
    stripTracking(resolved);
    if (!isAssetPath(resolved.pathname)) ensureTrailingSlash(resolved);
    resolved.hash = "";
    return resolved.toString();
  } catch {
    // Very malformed input → best-effort join
    const join = `${ORIGIN.origin}/${raw.replace(/^\/+/, "")}`;
    const u = new URL(join);
    stripTracking(u);
    if (!isAssetPath(u.pathname)) ensureTrailingSlash(u);
    u.hash = "";
    return u.toString();
  }
}

/** Stable node ids composed from the canonical absolute URL */
export function idFor(kind: string, href?: string) {
  const base = toAbsoluteUrl(href || "/");
  return `${base}#${kind}`;
}
