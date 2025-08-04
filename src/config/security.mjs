// src/config/security.mjs
// src/config/siteFunctions.ts
import { siteFunctions } from "../config/siteFunctions.js";
const emailHandler = siteFunctions?.contactFormHandler ?? '';
const cspReportHandler = siteFunctions?.cspReportHandler ?? '';

// src/config/security.mjs

// 🛡️ Content-Security-Policy (CSP) Directives
export const securityHeaders = {
  // Block all by default
  "default-src": ["'none'"],

  // Only allow base URLs from this origin (protects <base>)
  "base-uri": ["'self'"],

  // Disallow plugins and Flash
  "object-src": ["'none'"],

  // Only allow manifest file from own origin
  "manifest-src": ["'self'"],

  // Only allow workers from same origin
  "worker-src": ["'self'"],

  // Restrict where forms can submit to
  "form-action": ["'self'"],

  // Prevent this site from being embedded in any other frame
  "frame-ancestors": ["'none'"],

  // Automatically upgrade HTTP requests to HTTPS
  "upgrade-insecure-requests": true,

  // 🌐 External endpoints that JS can talk to (e.g., analytics, workers)
  "connect-src": [
    "'self'",
    "https://*.google-analytics.com",
    "https://www.googletagmanager.com",
    // "https://tagmanager.google.com", // → Enable if Tag Manager UI used
    "https://static.cloudflareinsights.com",
    "https://cloudflareinsights.com",
    // "https://*.cloudflare.com", // → Enable if other CF APIs are called
    "https://challenges.cloudflare.com",
    "https://nviewsweb-email-handler.nviews.workers.dev",
    // "https://pagead2.googlesyndication.com", // → Enable if AdSense enabled
     ...(emailHandler ? [emailHandler] : []),
    ...(cspReportHandler ? [cspReportHandler] : []),
  ],

  // 🖼️ Trusted image sources (further lockdown possible)
  "img-src": [
    "'self'",
    // "https://ssl.gstatic.com",
    // "https://www.gstatic.com",
    // "https://*.googleusercontent.com",
    "https://api.producthunt.com",
    "https://www.producthunt.com",
    "https://www.gravatar.com/"
    // "https://*.google-analytics.com",
    // "https://*.googletagmanager.com",
    // "https://*.gstatic.com"
  ],

  // 🔤 Fonts (Google Fonts OK)
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com"
  ],

  // 🎵 Trusted audio/video sources
  "media-src": [
    "'self'",
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://storage.googleapis.com",
    "https://video-ad-stats.googlesyndication.com"
  ],

  // 📜 Allowed JS sources
  "script-src": [
    "'self'",
    "https://www.googletagmanager.com/gtag/",
    // "https://tagmanager.google.com", // → Enable if GTM UI used
    // "https://www.google-analytics.com",
    "https://pagead2.googlesyndication.com",
    "https://challenges.cloudflare.com/turnstile/",
    "https://static.cloudflareinsights.com/beacon.min.js",
    "https://cloudflareinsights.com",
    "https://nviewsweb-email-handler.nviews.workers.dev",
     ...(emailHandler ? [emailHandler] : []),
    // `'nonce-xyz'` should be dynamically added for inline scripts (SSR)
  ],

  // 🎨 Allowed CSS sources
  "style-src": [
    "'self'",
    // "'unsafe-inline'", // ⚠️ Consider removing if you use CSP nonces instead
    "https://fonts.googleapis.com",
    ""
    // "https://tagmanager.google.com",
    // "https://www.googletagmanager.com"
  ],

  // 📺 Allowed frames (embedded videos, challenge pages)
  "frame-src": [
    "'self'",
    // "https://www.googletagmanager.com",
    // "https://*.googlesyndication.com",
    // "https://*.doubleclick.net",
    "https://challenges.cloudflare.com",
    "https://www.youtube.com",
    "https://player.vimeo.com",
    "https://www.producthunt.com"
  ],
  ...(cspReportHandler
    ? {
        "report-uri": cspReportHandler ?? "", // → Deprecated in favor of Reporting-Endpoints
        "report-to": "csp-endpoint",
        // Deprecated but still supported in older browsers (OK to leave)
      }
    : {})
};

// 🔐 Additional security & browser policy headers
export const extraHttpHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",

  // Force consistent MIME-type interpretation
  "X-Content-Type-Options": "nosniff",

  // Control referrer info
  "Referrer-Policy": "strict-origin-when-cross-origin",

  // Restrict powerful features
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",

  // Force long cache for static assets (adjust if needed)
  "Cache-Control": "public, max-age=31536001, immutable",

  // Restrict resource sharing
  "Cross-Origin-Resource-Policy": "same-origin",

  // ✅ CSP Reporting Endpoints
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

