// src/utils/last-modified.ts
import modifiedDates from '@/data/modified-dates.json';

/**
 * Returns the first non-empty last-modified string found for the given keys,
 * or (if provided) an ISO fallback derived from `fallback`.
 *
 * Example:
 *   const raw = lastModifiedRaw(['about', 'about-us'], siteDefaults.publishedDate);
 */
export function lastModifiedRaw(
  keys: string[],
  fallback?: string | number | Date
): string | undefined {
  const map = modifiedDates as Record<string, string | undefined>;

  for (const k of keys) {
    const v = map[k];
    if (v && String(v).trim()) return v;
  }

  if (fallback != null) {
    const d = new Date(fallback as any);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return undefined;
}
