/**
 * src/utils/minify.ts
 * Minimal, safe-ish JS minifier for inline snippets.
 * - Strips /* block *\/ and // line comments (but not URLs like http://)
 * - Collapses extra whitespace
 * - Trims around common punctuators
 *
 * NOTE: This is heuristic. Don’t use for full builds; use esbuild/terser there.
 */
export function minifyJS(code: string): string {
  if (!code) return '';
  return code
    // remove /* ... */ block comments
    .replace(/\/\*[^]*?\*\//g, '')
    // remove // line comments, but not after a colon (to keep http://)
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    // collapse runs of whitespace
    .replace(/\s{2,}/g, ' ')
    // trim around punctuators
    .replace(/\s*([{}();,:=+\-\[\]])\s*/g, '$1')
    .trim();
}
