// src/pages/sitemap.xml.ts
import { getCollection, type CollectionEntry, type DataEntryMap } from 'astro:content';
import { siteDefaults } from '@/config/siteDefaults';
import modifiedDatesJson from '@/data/modified-dates.json';
import { getImageMeta, constructUrl } from '@/utils/getImage'; // ← NEW


type CollectionsMap = typeof siteDefaults.collections;
type CollectionKey = Extract<keyof CollectionsMap, string>;
type CollectionCfg = CollectionsMap[CollectionKey];
type ModifiedMap = Record<string, string>;

const modifiedDates = modifiedDatesJson as ModifiedMap;

/* ---------------- Helpers ---------------- */
const typedEntries = <T extends Record<string, unknown>>(obj: T) =>
  Object.entries(obj) as Array<[keyof T, T[keyof T]]>;

const normPath = (p?: string): string => {
  if (!p) return '/';
  let out = String(p).trim();
  if (!out.startsWith('/')) out = '/' + out;
  if (!out.endsWith('/')) out = out + '/';
  return out;
};

const linkFor = (base: string, slug: string) => (base ? `/${base}/${slug}/` : `/${slug}/`);

const toIso = (d?: string) => (d ? new Date(d).toISOString() : undefined);

// Prefer modified-dates.json → lastModified/updatedDate → published/publish/upload → now
function lastModifiedFor(
  cfg: CollectionCfg,
  entry: CollectionEntry<keyof DataEntryMap> | any
): string {
  const base = (cfg?.base ?? '').replace(/^\/|\/$/g, '');
  const d: any = (entry as any)?.data ?? {};
  const slug = d?.slug ?? (entry as any)?.id;
  const key = base ? `${base}/${slug}` : String(slug);

  return (
    modifiedDates[key] ||
    d?.lastModified ||
    d?.updatedDate ||
    d?.publishedDate ||
    d?.publishDate ||
    d?.uploadDate ||
    new Date().toISOString()
  );
}

// Pull a representative image (works for baseSchema + videos/audio)
function imageFromEntry(entry: CollectionEntry<keyof DataEntryMap> | any): PageImage[] | undefined {
  const d: any = (entry as any)?.data ?? {};
  const key: string | undefined = d?.heroImage ?? d?.image;
  if (!key) return undefined;

  // Try to resolve via our image metadata JSON (preferred)
  const meta = getImageMeta(key);

  const urls: string[] = [];
  if (meta) {
    // One representative width in webp
    const webp = constructUrl(meta, 'desktop', 'webp') as string;
    urls.push(webp);

    // Add one non-webp fallback for broader crawler support
    const allFmtsAtDesktop = constructUrl(meta, 'desktop') as string[]; // all fmts for chosen width
    const backup = allFmtsAtDesktop.find((u) => !u.endsWith('.webp'));
    if (backup) urls.push(backup);
  } else {
    // If meta lookup failed, the frontmatter might already be a public/absolute path → pass through
    urls.push(key);
  }

  const title: string | undefined = d?.heroImageTitle || d?.imageTitle || d?.title;
  const caption: string | undefined = d?.heroImageCaption || d?.imageCaption || d?.description;

  return urls.map((u) => ({ loc: u, title, caption }));
}

type PageImage = { loc: string; title?: string; caption?: string };
type PageEntry = { url: string; lastmod?: string; priority?: number; images?: PageImage[] };

function pushPage(arr: PageEntry[], seen: Set<string>, entry: PageEntry) {
  if (!entry?.url) return;
  if (seen.has(entry.url)) return;
  seen.add(entry.url);
  arr.push(entry);
}

export async function GET() {
  try {
    const baseUrl = siteDefaults.siteUrl.replace(/\/$/, '');
    const pages: PageEntry[] = [];
    const seen = new Set<string>();

    /* ---------------------------------------------
     * 1) Static pages (siteDefaults.pages) — optional
     * ------------------------------------------- */
    const pagesCfg = (siteDefaults as any).pages as
      | Record<string, { path?: string; enabled?: boolean; sitemap?: boolean }>
      | undefined;

    if (pagesCfg) {
      for (const [pKey, pCfg] of typedEntries(pagesCfg)) {
        const keyStr = String(pKey);
        if (pCfg?.enabled === false || pCfg?.sitemap === false) continue;
        const pathStr = normPath(pCfg?.path);
        pushPage(pages, seen, {
          url: pathStr,
          // allow per-page override via modified-dates.json (keyed by page key)
          lastmod: modifiedDates[keyStr] ?? new Date().toISOString(),
          priority: keyStr === 'notFound' ? 0.1 : 0.6,
        });
      }
    }
    // Ensure home "/" present
    pushPage(pages, seen, { url: '/', priority: 1.0 });

    /* ---------------------------------------------
     * 2) FieldCollections base paths (/tags/, /categories/, ...)
     * ------------------------------------------- */
    const fieldColl = (siteDefaults as any).fieldCollections as Record<string, unknown> | undefined;
    if (fieldColl) {
      for (const key of Object.keys(fieldColl)) {
        pushPage(pages, seen, { url: normPath(`/${key}/`), priority: 0.6 });
      }
    }

    /* ---------------------------------------------
     * 3) Collection base paths (/blog/, /services/, /videos/, /audio/, ...)
     * ------------------------------------------- */
    for (const [, cfg] of typedEntries(siteDefaults.collections)) {
      const base = (cfg as any)?.base;
      if (base) pushPage(pages, seen, { url: normPath(`/${String(base)}/`), priority: 0.8 });
    }

    /* ---------------------------------------------
     * 4) Dynamic entries for every collection
     *    - videos: watch URL (frontmatter watchPageUrl or /watch/<slug>/)
     *    - audio:  listen URL (frontmatter listenPageUrl or /listen/<slug>/)
     * ------------------------------------------- */
    const watchRoot = normPath((pagesCfg?.watch?.path as string | undefined) ?? '/watch/');
    const listenRoot = normPath((pagesCfg?.listen?.path as string | undefined) ?? '/listen/');

    for (const [key, cfg] of typedEntries(siteDefaults.collections)) {
      const collectionKey = String(key) as CollectionKey;
      const c = cfg as CollectionCfg;

      if (!c?.index || c?.sitemap === false) continue;

      // IMPORTANT: use (entry) => { ... } and cast entry before touching .data
      const entries = await getCollection(key as keyof DataEntryMap, (entry) => {
        const d: any = (entry as any).data ?? {};
        if (String(entry.id).startsWith('_')) return false;
        if (d?.index === false) return false;
        if (typeof d?.slug === 'string' && d.slug.startsWith('_')) return false;
        if (d?.draft === true) return false;
        return true;
      });

      const base = (c.base ?? String(collectionKey)).replace(/^\/|\/$/g, '');
      const isVideo = collectionKey === 'videos';
      const isAudio = collectionKey === 'audio';

      for (const entry of entries) {
        const d: any = (entry as any).data ?? {};
        const slug: string = d?.slug ?? (entry as any).id;
        const contentUrl = linkFor(base, slug);
        const lastmod = lastModifiedFor(c, entry);

        const images = imageFromEntry(entry);

        // content page
        pushPage(pages, seen, { url: contentUrl, lastmod, images });

        // watch/listen distinct URL for video/audio
        if (isVideo) {
          const fmWatch: string | undefined = d?.watchPageUrl;
          const watchUrl = fmWatch ? normPath(fmWatch) : `${watchRoot}${slug}/`;
          if (watchUrl !== contentUrl) pushPage(pages, seen, { url: watchUrl, lastmod, priority: 0.7, images });
        } else if (isAudio) {
          const fmListen: string | undefined = d?.listenPageUrl;
          const listenUrl = fmListen ? normPath(fmListen) : `${listenRoot}${slug}/`;
          if (listenUrl !== contentUrl) pushPage(pages, seen, { url: listenUrl, lastmod, priority: 0.7, images });
        }
      }
    }

    /* ---------------------------------------------
     * 5) Build XML (with image extension)
     * ------------------------------------------- */
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const abs = (u: string) => (/^https?:\/\//i.test(u) ? u : `${baseUrl}${u.startsWith('/') ? '' : '/'}${u}`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map((p) => {
    const loc = abs(p.url);
    const lastmod = p.lastmod ? toIso(p.lastmod) : undefined;
    const imgs =
      p.images?.length
        ? p.images
            .map((im) => {
              const locAbs = abs(im.loc);
              const title = im.title ? `<image:title><![CDATA[${im.title}]]></image:title>` : '';
              const caption = im.caption ? `<image:caption><![CDATA[${im.caption}]]></image:caption>` : '';
              return `<image:image><image:loc>${esc(locAbs)}</image:loc>${title}${caption}</image:image>`;
            })
            .join('')
        : '';

    return `<url>
  <loc>${esc(loc)}</loc>
  ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
  ${typeof p.priority === 'number' ? `<priority>${p.priority.toFixed(1)}</priority>` : ''}
  ${imgs}
</url>`;
  })
  .join('\n')}
</urlset>`;

    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  } catch (err) {
    console.error('❌ Error generating sitemap:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
