import { siteFunctions } from "@/config/siteFunctions.js";

/* Helpers */
const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const add = (dst, key, values) => { if (values?.length) dst[key] = uniq([...(dst[key] || []), ...values]); };
const originOf = (u) => { try { return new URL(u).origin; } catch { return ""; } };

/* Shorthands */
const emailHandler    = originOf(siteFunctions?.contactFormHandler || "");
const cspReportOrigin = originOf(siteFunctions?.cspReportHandler || "");

/* Flags */
const adsOn        = siteFunctions.enableAdSense ?? !!siteFunctions.adsense;
const gaOn         = !!siteFunctions.googleAnalytics;  // GA4 (gtag)
const gtmOn        = !!siteFunctions.googleTag;        // GTM container
const cfInsightsOn = !!siteFunctions.cloudflareAnalytics;

const turnstileOn  = !!siteFunctions.turnstileEnabled && !!siteFunctions.turnstileSitekey;

const fontsOn      = !!siteFunctions.allowGoogleFonts;
const ytOn         = !!siteFunctions.enableYouTube;
const vimeoOn      = !!siteFunctions.enableVimeo;
const phOn         = !!siteFunctions.enableProductHunt;
const gravatarOn   = !!siteFunctions.allowGravatar;

/* Base CSP */
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
  "script-src-elem": ["'self'"],  // will be mirrored from script-src
  "script-src-attr": ["'none'"],
  "style-src": ["'self'"],
  "frame-src": ["'self'"],
};

function buildDirectives() {
  const h = structuredClone(BASE);

  if (emailHandler) {
    add(h, "connect-src", [emailHandler]);
    add(h, "form-action", ["'self'", emailHandler]);
  }

  if (cspReportOrigin) {
    h["report-uri"] = cspReportOrigin;
    h["report-to"]  = "csp-endpoint";
  }

  // GA (gtag.js from GTM)
  if (gaOn) {
    add(h, "connect-src", ["https://www.google-analytics.com", "https://www.googletagmanager.com"]);
    add(h, "img-src",     ["https://www.google-analytics.com"]);
    add(h, "script-src",  ["https://www.googletagmanager.com"]);
  }

  // GTM
  if (gtmOn) {
    add(h, "connect-src", ["https://www.googletagmanager.com", "https://www.google-analytics.com"]);
    add(h, "img-src",     ["https://www.googletagmanager.com", "https://*.googletagmanager.com"]);
    add(h, "script-src",  ["https://www.googletagmanager.com", "https://tagmanager.google.com"]);
    add(h, "frame-src",   ["https://www.googletagmanager.com"]);
  }

  // Cloudflare Web Analytics
  if (cfInsightsOn) {
    add(h, "connect-src", ["https://static.cloudflareinsights.com", "https://cloudflareinsights.com"]);
    add(h, "img-src",     ["https://cloudflareinsights.com"]);
    add(h, "script-src",  ["https://static.cloudflareinsights.com"]);
  }

  // Cloudflare Turnstile
  if (turnstileOn) {
    add(h, "connect-src", ["https://challenges.cloudflare.com"]);
    add(h, "script-src",  ["https://challenges.cloudflare.com"]);
    add(h, "frame-src",   ["https://challenges.cloudflare.com"]);
  }

  // Google Ads
  if (adsOn) {
    add(h, "connect-src", [
      "https://googleads.g.doubleclick.net",
      "https://pagead2.googlesyndication.com",
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
    ]);
    add(h, "img-src", [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://tpc.googlesyndication.com",
    ]);
    add(h, "media-src", [
      "https://video-ad-stats.googlesyndication.com",
      "https://storage.googleapis.com",
    ]);
    add(h, "script-src", [
      "https://pagead2.googlesyndication.com",
      "https://googleads.g.doubleclick.net",
      "https://www.googletagservices.com",
    ]);
    add(h, "frame-src", ["https://*.googlesyndication.com", "https://*.doubleclick.net"]);
  }

  // Google Fonts
  if (fontsOn) {
    add(h, "style-src", ["https://fonts.googleapis.com"]);
    add(h, "font-src",  ["https://fonts.gstatic.com"]);
  }

  // Product Hunt
  if (phOn) {
    add(h, "connect-src", ["https://api.producthunt.com"]);
    add(h, "img-src",     ["https://www.producthunt.com"]);
    add(h, "frame-src",   ["https://www.producthunt.com"]);
  }

  if (gravatarOn) add(h, "img-src", ["https://www.gravatar.com/"]);

  if (ytOn)   { add(h, "media-src", ["https://www.youtube.com"]);  add(h, "frame-src", ["https://www.youtube.com"]); }
  if (vimeoOn){ add(h, "media-src", ["https://player.vimeo.com"]); add(h, "frame-src", ["https://player.vimeo.com"]); }

  // de-dup
  for (const k of Object.keys(h)) if (Array.isArray(h[k])) h[k] = uniq(h[k]);

  // MIRROR: script-src → script-src-elem (make them identical)
  h["script-src-elem"] = [...h["script-src"]];

  return h;
}

/** Build headers; inject per-request nonce for inline <script> & <style>. */
export function getSecurityHeaders(nonce) {
  const h = buildDirectives();
  if (nonce) {
    const tok = `'nonce-${nonce}'`;
    // add to BOTH so they stay in lockstep
    h["script-src"].push(tok);
    h["script-src-elem"] = [...h["script-src"]]; // mirror after push
    h["style-src"].push(tok);                    // allow <style nonce="...">
  }
  return h;
}

/* Back-compat export (static, without nonce) */
export const securityHeaders = buildDirectives();

/* Extra headers */
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
