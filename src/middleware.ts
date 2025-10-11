// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { getSecurityHeaders, extraHttpHeaders } from "./config/security.mjs";

declare module "astro" {
  interface Locals { nonce: string }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // 1) Per-request nonce
  const nonce = crypto.randomUUID().replace(/-/g, "");
  context.locals.nonce = nonce;

  const res = await next();
  if (!res) return new Response(null, { status: 204 });

  const headers = new Headers(res.headers);
  const ct = headers.get("content-type") || "";
  const isHtml = ct.includes("text/html");
  const isXml =
    context.url.pathname.toLowerCase().endsWith(".xml") ||
    ct.includes("application/xml") ||
    ct.includes("text/xml");

  // 2) Build CSP with nonce (includes script-src-elem/script-src-attr)
  const sec = getSecurityHeaders(nonce);

  // For XML feeds/sitemaps, allow inline styles (no <script> there)
  if (isXml) {
    sec["style-src"] = [...new Set([...(sec["style-src"] || []), "'unsafe-inline'"])];
  }

  const csp = Object.entries(sec)
    .map(([k, v]) => {
      if (v === true) return k;                // e.g., upgrade-insecure-requests
      const vals = Array.isArray(v) ? v : [v]; // normalize
      return `${k} ${vals.join(" ")}`.trim();
    })
    .join("; ");

  headers.set(
    import.meta.env.DEV ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy",
    csp
  );

  // 3) Set extra security headers
  for (const [k, v] of Object.entries(extraHttpHeaders)) {
    headers.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }

  // 4) Service worker headers (optional)
  if (context.url.pathname === "/sw.js") {
    headers.set("Cache-Control", "no-cache");
    headers.set("Content-Type", "application/javascript");
    headers.set("Service-Worker-Allowed", "/");
  }

  // 5) Inject nonce into inline tags on HTML responses only
  if (isHtml && res.body) {
    const html = await res.text();

    // a) Inline executable <script> without src and without nonce
    //    Allow default/empty type, type="module", or type="text/javascript".
    const withScriptNonce = html.replace(
      /<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)(?=[^>]*(?:\btype\s*=\s*"(?:module|text\/javascript)"|[^>]*\btype\b\s*=\s*'?(?:module|text\/javascript)'?)|[^>]*?\b(?!type=))([^>]*)>/gi,
      (_m, attrs) => `<script nonce="${nonce}"${attrs}>`
    );

    // b) Inline <style> without nonce
    const withStyleNonce = withScriptNonce.replace(
      /<style(?![^>]*\bnonce=)([^>]*)>/gi,
      (_m, attrs) => `<style nonce="${nonce}"${attrs}>`
    );

    // (Optional) If you do want to nonce JSON data blocks, keep as-is.
    // We purposely did NOT add a nonce to type="application/json" to reduce noise.

    return new Response(withStyleNonce, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // Non-HTML (stream untouched)
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
