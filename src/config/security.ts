import { siteFunctions } from "@/config/siteFunctions.ts";

/* Types */
type DirectiveValue = string[] | string | boolean;
type Directives = Record<string, DirectiveValue>;

/* Helpers */
const uniq = (arr?: string[]) => Array.from(new Set((arr || []).filter(Boolean)));
const add = (dst: Directives, key: string, values?: string[]) => {
  if (values?.length) dst[key] = uniq([...(dst[key] as string[] | undefined || []), ...values]);
};
const originOf = (u?: string) => { try { return u ? new URL(u).origin : ""; } catch { return ""; } };

/* Shorthands */
const emailHandler    = originOf(siteFunctions?.contactFormHandler);
const cspReportOrigin = originOf(siteFunctions?.cspReportHandler);

/* Flags */
const adsOn        = siteFunctions.enableAdSense ?? !!siteFunctions.adsense;
const gaOn         = !!siteFunctions.googleAnalytics;     // GA4 (gtag)
const gtmOn        = !!siteFunctions.googleTag;           // GTM container
const cfInsightsOn = !!siteFunctions.cloudflareAnalytics;
const cfRumOn      = !!siteFunctions.enableCloudflareRUM;

const turnstileOn  = !!siteFunctions.turnstileEnabled && !!siteFunctions.turnstileSitekey;

const fontsOn      = !!siteFunctions.allowGoogleFonts;
const ytOn         = !!siteFunctions.enableYouTube;
const vimeoOn      = !!siteFunctions.enableVimeo;
const phOn         = !!siteFunctions.enableProductHunt;
const gravatarOn   = !!siteFunctions.allowGravatar;

/* Base CSP (no nonce here) */
const BASE: Directives = {
  "default-src": ["'none'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "manifest-src": ["'self'"],
  "worker-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": true,

  "connect-src": ["'self'"],
  "img-src": ["'self'"],
  "font-src": ["'self'"],
  "media-src": ["'self'"],

  // Modern + safe script policy. Hosts are Safari fallback.
  "script-src": ["'self'", "'strict-dynamic'", "'report-sample'"],
  "script-src-elem": ["'self'"],           // will be mirrored from script-src
  "script-src-attr": ["'none'"],

  // Allow inline <style nonce="..."> and include samples in violation reports
  "style-src": ["'self'", "'report-sample'"],
  "frame-src": ["'self'"],
};

function buildDirectives(): Directives {
  const h: Directives = structuredClone(BASE);

  if (emailHandler) {
    add(h, "connect-src", [emailHandler]);
    add(h, "form-action", ["'self'", emailHandler]);
  }

  if (cspReportOrigin) {
    // Keep report-uri for widest support (do NOT add deprecated Report-To)
    (h as any)["report-uri"] = cspReportOrigin;
  }

  // GA (gtag.js from GTM)
  if (gaOn) {
    add(h, "connect-src", [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.googletagmanager.com",
    ]);
    add(h, "img-src", [
      "https://www.google-analytics.com",
      "https://*.googletagmanager.com",
    ]);
    add(h, "script-src", ["https://www.googletagmanager.com"]);
  }

  // GTM
  if (gtmOn) {
    add(h, "connect-src", [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.googletagmanager.com",
    ]);
    add(h, "img-src", [
      "https://www.googletagmanager.com",
      "https://*.googletagmanager.com",
    ]);
    add(h, "script-src", ["https://www.googletagmanager.com", "https://tagmanager.google.com"]);
    add(h, "frame-src", ["https://www.googletagmanager.com"]);
  }

  // Cloudflare Web Analytics / RUM
  if (cfInsightsOn || cfRumOn) {
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
      // helpful extras for some ad flows:
      "https://securepubads.g.doubleclick.net",
      "https://www.googleadservices.com",
      "https://adservice.google.com",
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

  if (ytOn)    { add(h, "media-src", ["https://www.youtube.com"]);  add(h, "frame-src", ["https://www.youtube.com"]); }
  if (vimeoOn) { add(h, "media-src", ["https://player.vimeo.com"]); add(h, "frame-src", ["https://player.vimeo.com"]); }

  // de-dup
  for (const k of Object.keys(h)) if (Array.isArray(h[k] as any)) (h as any)[k] = uniq(h[k] as string[]);

  // MIRROR: script-src → script-src-elem (identical before nonce insertion)
  (h as any)["script-src-elem"] = [...(h["script-src"] as string[])];

  return h;
}

/* Ordering helpers */
function orderScriptSrc(list: string[], nonceToken?: string): string[] {
  const set = new Set(list);
  const hosts = Array.from(set).filter(v =>
    v !== "'self'" && v !== "'strict-dynamic'" && v !== "'report-sample'" && v !== nonceToken
  );
  return [
    "'self'",
    ...(nonceToken ? [nonceToken] : []),
    "'strict-dynamic'",
    "'report-sample'",
    ...hosts,
  ];
}

function orderStyleSrc(list: string[], nonceToken?: string): string[] {
  const set = new Set(list);
  const hosts = Array.from(set).filter(v =>
    v !== "'self'" && v !== "'report-sample'" && v !== nonceToken
  );
  return [
    "'self'",
    ...(nonceToken ? [nonceToken] : []),
    "'report-sample'",
    ...hosts,
  ];
}

/** Build headers; inject per-request nonce for inline <script> & <style> with strict ordering. */
export function getSecurityHeaders(nonce?: string): Directives {
  const h = buildDirectives();

  const nonceToken = nonce ? `'nonce-${nonce}'` : undefined;

  // Script ordering: 'self' → nonce → 'strict-dynamic' → 'report-sample' → hosts
  const scriptList = h["script-src"] as string[];
  h["script-src"] = orderScriptSrc(
    nonceToken ? uniq([...scriptList, nonceToken]) : scriptList,
    nonceToken
  );

  // Mirror to script-src-elem
  h["script-src-elem"] = [...(h["script-src"] as string[])];

  // Style ordering: 'self' → nonce → 'report-sample' → hosts
  const styleList = h["style-src"] as string[];
  h["style-src"] = orderStyleSrc(
    nonceToken ? uniq([...styleList, nonceToken]) : styleList,
    nonceToken
  );

  return h;
}

/* Back-compat export (static, without nonce) */
export const securityHeaders: Directives = buildDirectives();

/* Extra headers */
export const extraHttpHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
  "Cache-Control": "public, max-age=31536001, immutable",
  "Cross-Origin-Resource-Policy": "same-origin",
  ...(cspReportOrigin
    ? {
        // Modern Reporting API endpoint registration (kept; Report-To omitted)
        "Reporting-Endpoints": `csp-endpoint="${cspReportOrigin}"`,
      }
    : {}),
};
