// src/config/security.mjs
import { siteFunctions } from "@/config/siteFunctions.js";

/* Helpers */
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const add = (dst, key, values) => {
  if (!values?.length) return;
  dst[key] = uniq([...(dst[key] || []), ...values]);
};
const originOf = (u) => { try { return new URL(u).origin; } catch { return ""; } };

/* Shorthands (prefer ORIGINs in CSP) */
const emailHandler    = originOf(siteFunctions?.contactFormHandler || "");
const cspReportOrigin = originOf(siteFunctions?.cspReportHandler || "");

/* Feature flags */
const adsOn        = siteFunctions.enableAdSense ?? !!siteFunctions.adsense;
const gaOn         = !!siteFunctions.googleAnalytics;   // gtag GA4
const gtmOn        = !!siteFunctions.googleTag;         // GTM container
const cfInsightsOn = !!siteFunctions.cloudflareAnalytics;
const turnstileOn  = !!siteFunctions.turnstileEnabled && !!siteFunctions.turnstileSitekey;

const fontsOn      = !!siteFunctions.allowGoogleFonts;
const ytOn         = !!siteFunctions.enableYouTube;
const vimeoOn      = !!siteFunctions.enableVimeo;
const phOn         = !!siteFunctions.enableProductHunt;
const gravatarOn   = !!siteFunctions.allowGravatar;

/* Base CSP (locked) */
const BASE = {
  "default-src": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "manifest-src": ["'self'"],
  "worker-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": true,

  "connect-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'"],
  "media-src": ["'self'"],
  "script-src": ["'self'"],
  "script-src-elem": ["'self'"],       // mirror later
  "script-src-attr": ["'none'"],       // no inline event handlers
  "style-src": ["'self'"],
  "frame-src": ["'self'"],
};

/* Build directives */
function buildDirectives() {
  const headers = structuredClone(BASE);

  // Email/contact worker
  if (emailHandler) {
    add(headers, "connect-src", [emailHandler]);
    add(headers, "form-action", ["'self'", emailHandler]);
    // (No need to allow in script-src unless you load a script from there)
  }

  // CSP reporting
  if (cspReportOrigin) {
    headers["report-uri"] = cspReportOrigin;
    headers["report-to"]  = "csp-endpoint";
  }

  // Google Analytics (gtag.js loads from GTM)
  if (gaOn) {
    add(headers, "connect-src", [
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
    ]);
    add(headers, "img-src", ["https://www.google-analytics.com"]);
    add(headers, "script-src", ["https://www.googletagmanager.com"]);
  }

  // Google Tag Manager (optional)
  if (gtmOn) {
    add(headers, "connect-src", [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ]);
    add(headers, "img-src", [
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
    ]);
    add(headers, "script-src", [
      "https://www.googletagmanager.com",
      "https://tagmanager.google.com",
    ]);
    add(headers, "frame-src", ["https://www.googletagmanager.com"]);
  }

  // Cloudflare Web Analytics
  if (cfInsightsOn) {
    add(headers, "connect-src", [
      "https://static.cloudflareinsights.com",
      "https://cloudflareinsights.com",
    ]);
    add(headers, "img-src", ["https://cloudflareinsights.com"]);
    add(headers, "script-src", ["https://static.cloudflareinsights.com"]);
  }

  // Cloudflare Turnstile (use ORIGIN only)
  if (turnstileOn) {
    add(headers, "connect-src", ["https://challenges.cloudflare.com"]);
    add(headers, "script-src",  ["https://challenges.cloudflare.com"]);
    add(headers, "frame-src",   ["https://challenges.cloudflare.com"]);
  }

  // Google AdSense / Ads
  if (adsOn) {
    add(headers, "connect-src", [
      "https://googleads.g.doubleclick.net",
      "https://pagead2.googlesyndication.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ]);
    add(headers, "img-src", [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
    ]);
    add(headers, "media-src", [
      "https://video-ad-stats.googlesyndication.com",
      "https://storage.googleapis.com",
    ]);
    add(headers, "script-src", [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://www.googletagservices.com",
    ]);
    add(headers, "frame-src", [
      "https://*.googlesyndication.com",
      "https://*.doubleclick.net",
    ]);
  }

  // Google Fonts
  if (fontsOn) {
    add(headers, "style-src", ["https://fonts.googleapis.com"]);
    add(headers, "font-src",  ["https://fonts.gstatic.com"]);
  }

  // Product Hunt
  if (phOn) {
    add(headers, "connect-src", ["https://api.producthunt.com"]);
    add(headers, "img-src",     ["https://www.producthunt.com"]);
    add(headers, "frame-src",   ["https://www.producthunt.com"]);
  }

  // Gravatar
  if (gravatarOn) {
    add(headers, "img-src", ["https://www.gravatar.com/"]);
  }

  // YouTube / Vimeo
  if (ytOn) {
    add(headers, "media-src", ["https://www.youtube.com"]);
    add(headers, "frame-src", ["https://www.youtube.com"]);
  }
  if (vimeoOn) {
    add(headers, "media-src", ["https://player.vimeo.com"]);
    add(headers, "frame-src", ["https://player.vimeo.com"]);
  }

  // De-dup + mirror script-src → script-src-elem
  for (const k of Object.keys(headers)) {
    if (Array.isArray(headers[k])) headers[k] = uniq(headers[k]);
  }
  headers["script-src-elem"] = uniq([
    ...(headers["script-src-elem"] || []),
    ...(headers["script-src"] || []),
  ]);

  return headers;
}

/**
 * Build headers, optionally injecting a per-request nonce.
 * Add the SAME nonce to any inline <script nonce="..."> or <style nonce="..."> you keep.
 */
export function getSecurityHeaders(nonce) {
  const headers = buildDirectives();

  if (nonce) {
    const tok = `'nonce-${nonce}'`;
    add(headers, "script-src", [tok]);
    add(headers, "script-src-elem", [tok]);
    // Add to style-src only if you have inline <style> blocks:
    // add(headers, "style-src", [tok]);
  }

  return headers;
}

/* Export for compatibility with your existing import name */
export const securityHeaders = buildDirectives();

/* Extra security headers */
export const extraHttpHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Cache-Control": "public, max-age=31536001, immutable",
  "Cross-Origin-Resource-Policy": "same-origin",
  ...(cspReportOrigin
    ? {
        "Reporting-Endpoints": `csp-endpoint="${cspReportOrigin}"`,
        "Report-To": JSON.stringify({
          group: "csp-endpoint",
          max_age: 10886400,
          endpoints: [{ url: cspReportOrigin }],
          include_subdomains: true,
        }),
      }
    : {}),
};
