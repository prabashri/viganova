// src/utils/rss.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteDefaults } from '@/config/siteDefaults';
import modifiedDates from '@/data/modified-dates.json';

type CollectionsMap = typeof siteDefaults.collections;
type CollectionKey = Extract<keyof CollectionsMap, string>;
type CollectionCfg = CollectionsMap[CollectionKey];
type ModifiedMap = Record<string, string>;

// runtime guard so unknown keys 404 (and helps TS narrow)
function hasCollectionKey(key: string): key is CollectionKey {
  return Object.prototype.hasOwnProperty.call(siteDefaults.collections, key);
}

type DateResolver<K extends CollectionKey> = (entry: any, ctx: { base: string; collectionKey: K }) => string;
type SlugResolver = (entry: any) => string;
type FilterPredicate = (entry: any) => boolean;

function defaultDateResolver<K extends CollectionKey>(entry: any): string {
  // for baseSchema collections (blog/service/resource/post)
  return entry.data.lastModified || entry.data.updatedDate || entry.data.publishedDate;
}
const defaultSlugResolver: SlugResolver = (entry) => entry.data.slug ?? entry.id;

const linkFor = (base: string, slug: string) =>
  base ? `/${base}/${slug}/` : `/${slug}/`;

export async function buildCollectionRss<K extends CollectionKey>(opts: {
  collectionKey: K;
  label?: string;
  description?: string;

  /** Use modified-dates.json + lastModified/updated/published chain (default true). */
  useModifiedMap?: boolean;

  /** Override how pubDate is computed (e.g., videos use updatedDate || publishDate || uploadDate). */
  dateResolver?: DateResolver<K>;

  /** Optional extra filter (in addition to draft/index/_ guards). */
  extraFilter?: FilterPredicate;

  /** Override how slug is computed (rarely needed). */
  slugResolver?: SlugResolver;
}) {
  // 🔒 Global RSS disabled
  if (siteDefaults.rss !== true) {
    return new Response(null, { status: 204 });
  }

  const {
    collectionKey,
    label,
    description,
    useModifiedMap = true,
    dateResolver = defaultDateResolver,
    extraFilter,
    slugResolver = defaultSlugResolver,
  } = opts;

  if (!hasCollectionKey(collectionKey)) {
    return new Response(null, { status: 404 });
  }

  const cfg: CollectionCfg | undefined = siteDefaults.collections[collectionKey];
  if (!cfg?.index || cfg?.rss === false) {
    return new Response(null, { status: 404 });
  }

  const base = (cfg.base ?? collectionKey).replace(/^\/|\/$/g, '');

  // Pull entries (DataEntryMap keys may not match siteDefaults keys 1:1 → cast is fine)
  const entries: any[] = await getCollection(collectionKey as any);
  

  // Standard guards + optional extra filter
  const filtered = entries.filter((e) =>
    !String(e.id).startsWith('_') &&
    !(e.data?.slug && String(e.data.slug).startsWith('_')) && // ← extra guard
    e.data?.draft !== true &&
    e.data?.index !== false &&
    (extraFilter ? extraFilter(e) : true)
  );

  // Choose pubDate
  const resolvePubDate = (e: any): string => {
    if (!useModifiedMap) return dateResolver(e, { base, collectionKey });
    const slug = (slugResolver(e) || '').toString();
    const key  = `${base}/${slug}`;
    return (
      (modifiedDates as ModifiedMap)[key] ||
      dateResolver(e, { base, collectionKey })
    );
  };

  // Sort newest first
  const itemsSorted = filtered.sort((a, b) => {
    const ad = new Date(resolvePubDate(a)).valueOf();
    const bd = new Date(resolvePubDate(b)).valueOf();
    return bd - ad;
  });

  return rss({
    title: `${siteDefaults.siteName} | ${label ?? cfg?.['label'] ?? String(collectionKey)}`,
    description: description ?? `Latest ${String(collectionKey)} from ${siteDefaults.siteName}`,
    site: siteDefaults.siteUrl,
    items: itemsSorted.map((e) => {
      const slug = slugResolver(e);
      const link = linkFor(base, slug);            // ← use the safe link builder
      const pubDate = new Date(resolvePubDate(e));
      return {
        title: e.data.title,
        description: e.data.description,
        link,
        pubDate,
      };
    }),
  });
}
