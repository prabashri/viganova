import { getCollection, type CollectionEntry } from "astro:content";

export type ReviewEntry = CollectionEntry<"review">;
export type Review = ReviewEntry["data"];
export type ReviewType = "Service" | "Product" | "Organization";

export async function getAllReviews(): Promise<Review[]> {
  const entries = await getCollection("review");
  return entries
    .map(e => e.data)
    .sort((a, b) => (b.datePublished || "").localeCompare(a.datePublished || ""));
}

/** Limit by N or pick "recent" N (same thing since sorted newest-first). */
export async function getRecentReviews(count: number): Promise<Review[]> {
  const all = await getAllReviews();
  return all.slice(0, Math.max(0, count));
}

/** Optional per-type filter (for schema on specific pages). */
export async function getReviewsByType(t: ReviewType, limit?: number): Promise<Review[]> {
  const all = await getAllReviews();
  const filtered = all.filter(r => r.target?.type === t);
  return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
}

export function aggregateOf(list: Review[]) {
  const reviewCount = list.length;
  const total = list.reduce((s, r) => s + (Number(r.rating) || 0), 0);
  const ratingValue = reviewCount ? Number((total / reviewCount).toFixed(2)) : 0;
  return { ratingValue, reviewCount };
}

export async function getGlobalAggregate() {
  const all = await getAllReviews();
  return aggregateOf(all);
}
