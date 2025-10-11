// src/config/security.mjs
import { siteFunctions } from "@/config/siteFunctions.js";

// ===== Helpers ===============================================================
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const add = (dst, key, values) => {
  if (!values || values.length === 0) return;
  dst[key] = uniq([...(dst[key] || []), ...values]);
};
const originOf = (u) => {
  try { return new URL(u).origin; } catch { return ""; }
};

// Short-hands (prefer ORIGINs in CSP)
const emailHandler = originOf(siteFunctions?.contactFormHandler || "");
const cspReportHandler = originOf(siteFunctions?.cspReportHandler || "");

// Feature flags (derived from your existing keys + the new minimal toggles)
const adsOn        = siteFunctions.enableAdSense ?? Boolean(siteFunctions.adsense);
const gaOn         = !!siteFunctions.googleAnalytics;
const gtmOn        = !!siteFunctions.googleTag;
const cfInsightsOn = !!siteFunctions.cloudflareAnalytics;
const turnstileOn  = !!siteFunctions.turnstileEnabled && !!siteFunctions.turnstileSitekey;

const fontsOn      = !!siteFunctions.allowGoogleFonts;
const ytOn         = !!siteFunctions.enableYouTube;
const vimeoOn      = !!siteFunctions.enableVimeo;
const phOn         = !!siteFunctions.enableProductHunt;
const gravatarOn   = !!siteFunctions.allowGravatar;

// ===== Base CSP (locked by default) ==========================================
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
  "style-src": ["'self'"],
  "frame-src": ["'self'"]
};

// ===== Apply feature packs ====================================================
const headers = structuredClone(BASE);

// Email/contact worker
if (emailHandler) {
  add(headers, "connect-src", [emailHandler]);
  add(headers, "script-src",  [emailHandler]); // if your frontend fetches it directly
  add(headers, "form-action", ["'self'", emailHandler]); // allow form POST to worker
}

// CSP reporting
if (cspReportHandler) {
  headers["report-uri"] = cspReportHandler; // legacy but still useful
  headers["report-to"]  = "csp-endpoint";
}

// Google Analytics
if (gaOn) {
  add(headers, "connect-src", ["https://www.google-analytics.com"]);
  add(headers, "img-src",     ["https://www.google-analytics.com"]);
  add(headers, "script-src",  ["https://www.google-analytics.com"]);
}

// Google Tag Manager
if (gtmOn) {
  add(headers, "connect-src", [
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com"
  ]);
  add(headers, "img-src", [
    "https://www.googletagmanager.com",
    "https://*.googletagmanager.com"
  ]);
  add(headers, "script-src", [
    "https://www.googletagmanager.com",
    "https://tagmanager.google.com"
  ]);
  add(headers, "frame-src", ["https://www.googletagmanager.com"]);
}

// Cloudflare Web Analytics
if (cfInsightsOn) {
  add(headers, "connect-src", [
    "https://static.cloudflareinsights.com",
    "https://cloudflareinsights.com"
  ]);
  add(headers, "script-src", [
    "https://static.cloudflareinsights.com/beacon.min.js",
    "https://cloudflareinsights.com"
  ]);
}

// Cloudflare Turnstile
if (turnstileOn) {
  add(headers, "connect-src", ["https://challenges.cloudflare.com"]);
  add(headers, "script-src",  ["https://challenges.cloudflare.com/turnstile/"]);
  add(headers, "frame-src",   ["https://challenges.cloudflare.com"]);
}

// Google AdSense / Ads
if (adsOn) {
  add(headers, "connect-src", [
    "https://googleads.g.doubleclick.net",
    "https://pagead2.googlesyndication.com",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com"
  ]);
  add(headers, "img-src", [
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com"
  ]);
  add(headers, "media-src", [
    "https://video-ad-stats.googlesyndication.com",
    "https://storage.googleapis.com"
  ]);
  add(headers, "script-src", [
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
    "https://www.googletagservices.com"
  ]);
  add(headers, "frame-src", [
    "https://*.googlesyndication.com",
    "https://*.doubleclick.net"
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

// Avatars (Gravatar)
if (gravatarOn) {
  add(headers, "img-src", ["https://www.gravatar.com/"]);
}

// YouTube
if (ytOn) {
  add(headers, "media-src", ["https://www.youtube.com"]);
  add(headers, "frame-src", ["https://www.youtube.com"]);
}

// Vimeo
if (vimeoOn) {
  add(headers, "media-src", ["https://player.vimeo.com"]);
  add(headers, "frame-src", ["https://player.vimeo.com"]);
}

// Final de-duplication
for (const k of Object.keys(headers)) {
  if (Array.isArray(headers[k])) headers[k] = uniq(headers[k]);
}

// 🛡️ Export CSP directives
export const securityHeaders = headers;

// 🔐 Additional security & browser policy headers
export const extraHttpHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Cache-Control": "public, max-age=31536001, immutable",
  "Cross-Origin-Resource-Policy": "same-origin",
  ...(cspReportHandler
    ? {
        "Reporting-Endpoints": `csp-endpoint="${cspReportHandler}"`,
        "Report-To": JSON.stringify({
          group: "csp-endpoint",
          max_age: 10886400,
          endpoints: [{ url: cspReportHandler }],
          include_subdomains: true
        })
      }
    : {})
};
