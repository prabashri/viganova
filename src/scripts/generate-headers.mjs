/**
 * generate-headers.ts or .mjs
 * Generates _headers file for static builds only.
 * Intended for Cloudflare Pages or similar static hosting.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Get __dirname in ES module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths
const astroConfigPath = pathToFileURL(path.resolve(__dirname, '../../astro.config.mjs'));
const securityConfigPath = pathToFileURL(path.resolve(__dirname, '../config/security.mjs'));

// Load Astro config
let astroConfig;
try {
  astroConfig = await import(astroConfigPath.href);
} catch (err) {
  console.error('❌ Failed to load astro.config.mjs:', err);
  process.exit(1);
}

// Check output type
if (astroConfig?.default?.output !== 'static') {
  console.log('ℹ️ This is an SSR site. Skipping _headers generation.');
  process.exit(0);
}

// Load security headers
let securityHeaders = {};
let extraHttpHeaders = {};
try {
  const config = await import(securityConfigPath.href);
  securityHeaders = config.securityHeaders || {};
  extraHttpHeaders = config.extraHttpHeaders || {};
} catch (err) {
  console.error('❌ Failed to import security config:', err);
  process.exit(1);
}

// Compute output file path
const headersPath = process.argv.includes('--dist')
  ? path.resolve(__dirname, '../../dist/_headers')
  : path.resolve(__dirname, '../../public/_headers');

// Build CSP string
function buildCSP(policyObject) {
  return Object.entries(policyObject)
    .map(([key, value]) =>
      Array.isArray(value) ? `${key} ${value.join(' ')}` : `${key} ${value}`
    )
    .join('; ');
}

// Compose header content
let output = `/*\n`;
if (Object.keys(securityHeaders).length > 0) {
  output += `  Content-Security-Policy: ${buildCSP(securityHeaders)}\n`;
}
for (const [key, value] of Object.entries(extraHttpHeaders)) {
  output += `  ${key}: ${value}\n`;
}
output += `\n`;

// Write headers file
try {
  await fs.mkdir(path.dirname(headersPath), { recursive: true });
  await fs.writeFile(headersPath, output.trim(), 'utf8');
  console.log(`✅ _headers built successfully at: ${headersPath}`);
} catch (err) {
  console.error('❌ Error writing _headers file:', err);
  process.exit(1);
}
