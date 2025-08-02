// src/utils/collectFieldCounts.ts
import { getCollection } from "astro:content";
import { siteDefaults } from "../config/siteDefaults";

/**
 * Collects counts for a given field (tags, categories, etc.)
 * Filters out:
 * - Entries where slug starts with "_"
 * - Entries where draft === true
 *
 * @param field The frontmatter field name to count
 * @param limitPerEntry Limit number of values per entry (default 3)
 */
export async function collectFieldCounts(
  field: string,
  limitPerEntry: number = 3
): Promise<{ name: string; count: number }[]> {
  // 1️⃣ Find collections that declare support for this field
  const collections = Object.entries(siteDefaults.collections)
    .filter(([_, config]) => config?.[field as keyof typeof config] === true)
    .map(([key]) => key) as (keyof typeof siteDefaults.collections)[];

  const counts = new Map<string, number>();

  // 2️⃣ Loop through collections
  for (const coll of collections) {
    const entries = await getCollection(coll);

    // 3️⃣ Filter out drafts and _slug entries early
    const validEntries = entries.filter(entry => {
      const id = typeof entry.id === "string" ? entry.id : "";
      const isDraft = "draft" in entry.data ? entry.data.draft === true : false;
      return !id.startsWith("_") && !isDraft;
    });

    // 4️⃣ Process each valid entry
    for (const entry of validEntries) {
      if (!entry.data || !(field in entry.data)) continue;

      const rawValues = (entry.data as Record<string, unknown>)[field];

      // Normalize to array & limit
      const values = Array.isArray(rawValues)
        ? rawValues.slice(0, limitPerEntry)
        : typeof rawValues === "string"
          ? [rawValues]
          : [];

      // Count each value (case-insensitive)
      for (const val of values) {
        if (!val) continue;
        const lower = val.toString().toLowerCase();
        counts.set(lower, (counts.get(lower) ?? 0) + 1);
      }
    }
  }

  // 5️⃣ Return sorted array
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
