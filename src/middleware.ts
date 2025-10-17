import { defineMiddleware } from "astro:middleware";
import { getSecurityHeaders, extraHttpHeaders } from "./config/security.mjs";

declare module "astro" {
  interface Locals {
    nonce: string;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // stable, header-safe nonce
  
  const nonce = crypto.randomUUID().replace(/-/g, "");
  (context.locals as any).nonce = nonce;

  const response = await next();
  if (!response) return new Response(null, { status: 204 });

  const headers = new Headers(response.headers);
  const contentType = headers.get("content-type") || "";

  const isHtml = contentType.includes("text/html");
  const isXml =
    context.url.pathname.toLowerCase().endsWith(".xml") ||
    contentType.includes("application/xml") ||
    contentType.includes("text/xml");

  // Build CSP with the nonce; allow inline styles for XML feeds only
  const security = getSecurityHeaders(nonce);
  if (isXml) {
    const arr = Array.isArray(security["style-src"]) ? security["style-src"] : [security["style-src"]];
    security["style-src"] = Array.from(new Set([...arr, "'unsafe-inline'"]));
  }

  const cspValue = Object.entries(security)
    .map(([directive, value]) => {
      if (value === true) return directive; // e.g., upgrade-insecure-requests
      const values = Array.isArray(value) ? value : [value];
      return `${directive} ${values.join(" ")}`.trim();
    })
    .join("; ");

  const cspHeaderName = import.meta.env.DEV
    ? "Content-Security-Policy-Report-Only"
    : "Content-Security-Policy";
  headers.set(cspHeaderName, cspValue);

  // Extra security headers
  for (const [k, v] of Object.entries(extraHttpHeaders)) {
    headers.set(k, typeof v === "string" ? v : JSON.stringify(v));
  }

  // Service worker extras (optional)
  if (context.url.pathname === "/sw.js") {
    headers.set("Cache-Control", "no-cache");
    headers.set("Content-Type", "application/javascript");
    headers.set("Service-Worker-Allowed", "/");
  }

  // Inject nonce attribute into inline <script> (no src) and <style> on HTML only
  /*
  if (isHtml && response.body) {
    const rawHtml = await response.text();

    const withScriptNonce = rawHtml.replace(
      /<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/gi,
      (_m, attrs) => `<script nonce="${nonce}"${attrs}>`
    );

    const withStyleNonce = withScriptNonce.replace(
      /<style(?![^>]*\bnonce=)([^>]*)>/gi,
      (_m, attrs) => `<style nonce="${nonce}"${attrs}>`
    );

    return new Response(withStyleNonce, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
*/
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
