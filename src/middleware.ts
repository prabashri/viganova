// src/middleware.ts
import { defineMiddleware } from "astro:middleware";


import { securityHeaders, extraHttpHeaders } from './config/security.mjs';
import type { MiddlewareHandler } from "astro";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const response = await next();

  response.headers.set("Content-Security-Policy", "default-src 'self'");

  return response;
};