// src/middleware.ts
import type { MiddlewareHandler } from 'astro';

import { securityHeaders, extraHttpHeaders } from './config/security.mjs';

const isDev = import.meta.env.DEV;
const isServerOutput = import.meta.env.ASTRO_OUTPUT === 'server';

// Extend Astro Locals to include `nonce`
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

export const onRequest: MiddlewareHandler = async (context, next) => {
  // Only apply CSP if output is server
  if (!isServerOutput) return next();

  const nonce = crypto.randomUUID();
  context.locals.nonce = nonce;

  const response = await next();
  if (!response) return new Response(null, { status: 204 });

  const headers = new Headers(response.headers);
  const contentType = headers.get('content-type') || '';
  const isHtml = contentType.includes('text/html');

  // --- Construct Content-Security-Policy or Report-Only ---
  const cspValue = Object.entries(securityHeaders as SecurityHeaders)
    .map(([directive, value]) => {
      if (typeof value === 'boolean' && value) return directive;
      const values = Array.isArray(value) ? value : [value];
      const needsNonce = directive === 'script-src';
      return `${directive} ${[...values, ...(needsNonce ? [`'nonce-${nonce}'`] : [])].join(' ')}`;
    })
    .join('; ');

  const cspHeaderName = isDev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  headers.set(cspHeaderName, cspValue);

  // --- Set extra security headers ---
  for (const [key, val] of Object.entries(extraHttpHeaders as ExtraHttpHeaders)) {
    headers.set(key, typeof val === 'string' ? val : JSON.stringify(val));
  }

  // --- Modify HTML response body to inject nonce ---
  if (isHtml && response.body) {
    const rawHtml = await response.text();

    const htmlWithNonce = rawHtml.replace(
      /<script(?![^>]*\bsrc=)(?![^>]*\bnonce=)([^>]*)>/g,
      `<script nonce="${nonce}"$1>`
    );

    return new Response(htmlWithNonce, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Non-HTML responses: keep body, just update headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
