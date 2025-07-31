import { getCollection } from "astro:content";
import { siteDefaults } from "../config/siteDefaults";

/**
 * Collects counts for a given field (tags, categories, fields, etc.)
 * @param field The frontmatter field name to count
 * @param limitPerEntry Limit number of values per entry (default 3)
 */
export async function collectFieldCounts(
  field: string,
  limitPerEntry: number = 3
): Promise<{ name: string; count: number }[]> {
  // Find collections that declare support for this field
  const collections = Object.entries(siteDefaults.collections)
    .filter(([_, config]) => config?.[field as keyof typeof config] === true)
    .map(([key]) => key) as (keyof typeof siteDefaults.collections)[];

  const counts = new Map<string, number>();

  for (const coll of collections) {
    const entries = await getCollection(coll);

    for (const entry of entries) {
      if (!entry.data || !(field in entry.data)) continue;

      const rawValues = (entry.data as Record<string, unknown>)[field];

      const values = Array.isArray(rawValues)
        ? rawValues.slice(0, limitPerEntry)
        : typeof rawValues === "string"
          ? [rawValues]
          : [];

      for (const val of values) {
        if (!val) continue;
        const lower = val.toString().toLowerCase();
        counts.set(lower, (counts.get(lower) ?? 0) + 1);
      }
    }
  }

  // Return sorted array
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
