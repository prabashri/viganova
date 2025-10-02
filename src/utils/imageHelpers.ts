// src/utils/imageHelpers.ts
export type ParsedDims = {
  width: number;
  height: number;
  aspect: `${number}x${number}`;
  format: string;           // "png" | "webp" | "avif" | ...
  basename: string;         // filename without suffixes
  path: string;             // "images/2025/08/image" (no suffix), if present
};

/**
 * Parse a public image URL/filename like:
 *   images/2025/08/image-w1280-a16x9.webp
 *   image-w640-a1x1.png
 *   https://cdn.example.com/images/..../name-w-960-a4x3.jpg?ver=2
 */
export function parseImageDims(urlOrFilename: string): ParsedDims | null {
  // tolerant to "-w640-" or "-w-640-"; captures path, basename, width, aspect, extension
  const RE =
    /^(?<prefix>.*?)(?<basename>[^\/?#]+?)-w-?(?<width>\d+)-a(?<aw>\d+)x(?<ah>\d+)\.(?<ext>[a-z0-9]+)(?:[?#].*)?$/i;

  const m = urlOrFilename.match(RE);
  if (!m || !m.groups) return null;

  const width = Number(m.groups.width);
  const aw = Number(m.groups.aw);
  const ah = Number(m.groups.ah);
  if (!width || !aw || !ah) return null;

  const height = Math.round(width * (ah / aw));
  const aspect = `${aw}x${ah}` as const;

  // Build a "path without suffix" if a prefix exists
  // e.g., "images/2025/08/image"
  let path = '';
  if (m.groups.prefix) {
    const stripped = m.groups.prefix.replace(/^[a-z]+:\/\/[^/]+/i, ''); // remove protocol+host if any
    const cleaned = stripped.replace(/\/+$/, ''); // drop trailing slash
    path = `${cleaned ? cleaned + '/' : ''}${m.groups.basename}`.replace(/^\/+/, '');
  } else {
    path = m.groups.basename;
  }

  return {
    width,
    height,
    aspect,
    format: m.groups.ext.toLowerCase(),
    basename: m.groups.basename,
    path
  };
}
