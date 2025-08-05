// src/middleware.ts
import { defineMiddleware } from "astro:middleware";
import { securityHeaders, extraHttpHeaders } from './config/security.mjs';

declare module 'astro' {
  interface Locals {
    nonce: string;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const nonce = crypto.randomUUID();
  context.locals.nonce = nonce;

  const response = await next();
  if (!response) return new Response(null, { status: 204 });

  const headers = new Headers(response.headers);
  const contentType = headers.get('content-type') || '';

  const isHtml = contentType.includes('text/html');
  const isXml =
    context.url.pathname.toLowerCase().endsWith('.xml') ||
    contentType.includes('application/xml') ||
    contentType.includes('text/xml');

  // ✅ Adjust CSP dynamically
  const adjustedSecurityHeaders = { ...securityHeaders };
  if (isXml) {
    adjustedSecurityHeaders['style-src'] = [
      ...(Array.isArray(adjustedSecurityHeaders['style-src'])
        ? adjustedSecurityHeaders['style-src']
        : [adjustedSecurityHeaders['style-src']]),
      "'unsafe-inline'"
    ];
  }

  const cspValue = Object.entries(adjustedSecurityHeaders)
    .map(([directive, value]) => {
      if (typeof value === 'boolean' && value) return directive;
      const values = Array.isArray(value) ? value : [value];
      const needsNonce = ['script-src', 'style-src'].includes(directive);
      return `${directive} ${[
        ...values,
        ...(needsNonce && isHtml && !isXml ? [`'nonce-${nonce}'`] : [])
      ].join(' ')}`;
    })
    .join('; ');

  const isDev = import.meta.env.DEV;
  const cspHeaderName = isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  headers.set(cspHeaderName, cspValue);

  // ✅ Extra headers
  for (const [key, val] of Object.entries(extraHttpHeaders)) {
    headers.set(key, typeof val === 'string' ? val : JSON.stringify(val));
  }

  // ✅ Service worker headers
  if (context.url.pathname === '/sw.js') {
    headers.set('Cache-Control', 'no-cache');
    headers.set('Content-Type', 'application/javascript');
    headers.set('Service-Worker-Allowed', '/');
  }

  // ✅ Add nonce to HTML only
  if (isHtml && response.body) {
    const rawHtml = await response.text();
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
