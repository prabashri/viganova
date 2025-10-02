// src/utils/buildFieldPages.ts
import { getCollection } from "astro:content";
import { siteDefaults } from "../config/siteDefaults";
import { siteImages } from "../config/siteImages";
import { collectFieldCounts } from "./collectFieldCounts";
import modifiedDatesJson from "../data/modified-dates.json";
import { paginate } from "./paginate";
import { getCollectionUrl } from "./getCollectionUrl";
import type { HeadProps } from "../types/HeadProps";

function getModifiedDate(entry: any) {
  const key = `${entry.collection}/${entry.slug ?? entry.id}`;
  return (modifiedDatesJson as Record<string, string>)[key] ??
    entry.data.lastModified ??
    entry.data.publishedDate ??
    entry.data.date ??
    new Date(0).toISOString();
}

export async function buildFieldIndexPage(fieldKey: string) {
  const items = await collectFieldCounts(fieldKey, 3); // count items
  return Array.from(items.entries());
}

export async function buildFieldValuePage(fieldKey: string, fieldValue: string, currentPage: number) {
  const POSTS_PER_PAGE = siteDefaults.postsPerCollectionsPage ?? 10;

  // collections that have this field enabled
  const collections = Object.entries(siteDefaults.collections)
    .filter(([_, c]) => (c as Record<string, unknown>)?.[fieldKey] === true)
    .map(([k]) => k);

  let matched: any[] = [];
  for (const coll of collections) {
    const posts = await getCollection(coll as any);
    matched.push(
      ...posts.filter(
        (entry) => {
          const e = entry as { data?: Record<string, any> };
          return Array.isArray(e.data?.[fieldKey]) &&
            e.data[fieldKey].some((v: string) => v.toLowerCase() === fieldValue);
        }
      )
    );
  }

  matched.sort(
    (a, b) =>
      new Date(getModifiedDate(b)).getTime() - new Date(getModifiedDate(a)).getTime()
  );

  const { pageItems, totalPages } = paginate(matched, currentPage, POSTS_PER_PAGE);

  // SEO props
  const headProps: HeadProps = {
    title: `${fieldValue} | ${siteDefaults.siteName}`,
    description: `Explore ${fieldKey} → ${fieldValue} on ${siteDefaults.siteName}`,
    image: siteImages.image,
    index: pageItems.length > 0,
    type: "collection",
    authors: [],
    breadcrumbs: [
      { name: "Home", url: "/" },
      { name: fieldKey, url: `/${fieldKey}/` },
      { name: fieldValue, url: `/${fieldKey}/${fieldValue}/` }
    ],
    listItems: pageItems.map((p) => ({
      name: p.data.title ?? "Untitled",
      url: getCollectionUrl(p.collection, p.data.slug ?? p.id)
    }))
  };

  return { pageItems, totalPages, headProps };
}
