// src/middleware.ts (verifiedapostille)
import { defineMiddleware } from "astro:middleware";
import { getSecurityHeaders, extraHttpHeaders } from "./config/security.js";

declare module "astro" {
  interface Locals { nonce: string }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  (context.locals as any).nonce = nonce;

  const res = await next();
  if (!res) return new Response(null, { status: 204 });

  const headers = new Headers(res.headers);
  const ct = headers.get("content-type") || "";
  const path = context.url.pathname.toLowerCase();

  const isHtml = ct.includes("text/html");
  const isXmlLike =
    path.endsWith(".xml") || ct.includes("application/xml") || ct.includes("text/xml");
  const isJsonLike =
    ct.includes("application/json") || path.endsWith(".webmanifest") || path.endsWith(".json");
  const isPlainTextLike =
    path.endsWith("/robots.txt") || ct.includes("text/plain");

  // ---- 1) For non-HTML: do NOT set CSP (prevents DevTools XML styling warnings)
  if (isXmlLike || isJsonLike || isPlainTextLike) {
    // You can still add minimal hardening headers:
    headers.set("X-Content-Type-Options", "nosniff");
    for (const [k, v] of Object.entries(extraHttpHeaders)) {
      headers.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }

  // ---- 2) HTML: full CSP
  if (isHtml) {
    const security = getSecurityHeaders(nonce); // build your directives object here
    const csp = Object.entries(security)
      .map(([dir, val]) => {
        if (val === true) return dir;                 // e.g. upgrade-insecure-requests
        const vals = Array.isArray(val) ? val : [val];
        return `${dir} ${vals.join(" ")}`.trim();
      })
      .join("; ");

    const cspName = import.meta.env.DEV
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy";
    headers.set(cspName, csp);

    for (const [k, v] of Object.entries(extraHttpHeaders)) {
      headers.set(k, typeof v === "string" ? v : JSON.stringify(v));
    }

    // (Optional) If you want to auto-nonce inline <script> tags, uncomment:
    /*
    if (res.body) {
      const html = await res.text();
      const withNonce = html
        .replace(/<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${nonce}"$1>`)
        .replace(/<style(?![^>]*\bnonce=)([^>]*)>/gi, `<style nonce="${nonce}"$1>`);
      return new Response(withNonce, { status: res.status, statusText: res.statusText, headers });
    }
    */
  }

  // ---- 3) Everything else unchanged
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
