// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { securityHeaders, extraHttpHeaders } from './config/security.mjs';

declare module 'astro' {
  interface Locals {
    nonce: string;
  }
}

interface SecurityHeaders {
  [directive: string]: string | string[] | boolean;
}

interface ExtraHttpHeaders {
  [key: string]: string | object;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = crypto.randomUUID();
  context.locals.nonce = nonce;

  const response = await next();
  if (!response) return new Response(null, { status: 204 });

  const headers = new Headers(response.headers);
  const contentType = headers.get('content-type') || '';
  const isHtml = contentType.includes('text/html');

  // Construct CSP
  const cspValue = Object.entries(securityHeaders as SecurityHeaders)
    .map(([directive, value]) => {
      if (typeof value === 'boolean' && value) return directive;
      const values = Array.isArray(value) ? value : [value];
      const needsNonce = ['script-src', 'style-src'].includes(directive);
      return `${directive} ${[...values, ...(needsNonce ? [`'nonce-${nonce}'`] : [])].join(' ')}`;
    })
    .join('; ');

  const isDev = import.meta.env.DEV;
  const cspHeaderName = isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  headers.set(cspHeaderName, cspValue);

  // Apply extra headers
  for (const [key, val] of Object.entries(extraHttpHeaders as ExtraHttpHeaders)) {
    headers.set(key, typeof val === 'string' ? val : JSON.stringify(val));
  }
  if (context.url.pathname === '/sw.js') {
    headers.set('Cache-Control', 'no-cache'); // 🔁 Always checks for updates on reload
    headers.set('Content-Type', 'application/javascript'); // ✅ Ensures correct MIME type
    headers.set('Service-Worker-Allowed', '/'); // 🔓 Allows controlling full scope of the origin
  }


  // Add nonce to inline scripts
  if (isHtml && response.body) {
    const rawHtml = await response.text();

    // Add nonce to inline <script> and <style> tags in one pass for performance
    const htmlWithNonce = rawHtml.replace(
      /<(script(?![^>]*\bsrc=)|style)(?![^>]*\bnonce=)([^>]*)>/g,
      (_match, tag, attrs) => `<${tag} nonce="${nonce}"${attrs}>`
    );

    return new Response(htmlWithNonce, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
