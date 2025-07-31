// src/utils/getCollectionUrl.ts
import { siteDefaults } from '../config/siteDefaults';

type CollectionKey = keyof typeof siteDefaults.collections;

export function getCollectionUrl(collection: CollectionKey, slug: string) {
  const base = siteDefaults.collections?.[collection]?.base ?? collection;
  return base
    ? `/${base.replace(/^\/|\/$/g, '')}/${slug}/`
    : `/${slug}/`; // If base is empty, slug goes at root
}
