// src/pages/api/posts-by-author.ts
import { getCollection } from 'astro:content';
import type { DataEntryMap } from 'astro:content';

export async function GET({ url, request }: { url: URL; request: Request }) {
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';

  try {
    // same-origin guard
    if (origin && new URL(origin).hostname !== host) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slug = url.searchParams.get('slug') || '';
    const offset = Number(url.searchParams.get('offset') || '6');
    const loaded = Number(url.searchParams.get('loaded') || '0');
    const sort = url.searchParams.get('sort') || 'lastmodified';
    const totalExpected = Number(url.searchParams.get('total') || '0'); // not required here, but kept

    if (!slug) {
      return new Response(JSON.stringify({ posts: [], hasMore: false }), { status: 400 });
    }

    // collections: support repeated & comma-separated
    const collectionsMulti = url.searchParams.getAll('collections');
    const collectionsToSearch =
      collectionsMulti.length > 0
        ? collectionsMulti.flatMap((c) => c.split(',').map((s) => s.trim()).filter(Boolean))
        : ['blog', 'post'];

    // ---------- helpers ----------
    const segHasUnderscore = (v: string) => v.split('/').some((seg) => seg.startsWith('_'));

    const getRuntimeSlug = (entry: any): string =>
      // Astro injects `entry.slug` at runtime for content collections
      (entry?.slug as string) ?? (entry?.data?.slug as string) ?? '';

    const isHiddenEntry = (entry: any): boolean => {
      if (entry?.data?.draft === true) return true;
      if (segHasUnderscore(entry.id)) return true;
      if (segHasUnderscore(getRuntimeSlug(entry))) return true;
      return false;
    };

    const authorMatches = (authors: unknown, wanted: string): boolean => {
      const arr = Array.isArray(authors) ? authors : [];
      const wantedVariants = new Set([
        wanted,
        `team/${wanted}`,
        // if your team collection base differs, add it here, e.g. `members/${wanted}`
      ]);
      return arr.some((a: any) => {
        if (typeof a === 'string') return wantedVariants.has(a) || a.endsWith(`/${wanted}`);
        const id = a?.id ?? a; // some schemas store string in `id`, some as plain string
        return typeof id === 'string' && (wantedVariants.has(id) || id.endsWith(`/${wanted}`));
      });
    };

    const getLastModified = (entry: any): string => {
      const lm = entry?.data?.lastModified || entry?.data?.updatedDate || entry?.data?.publishedDate;
      return lm ? new Date(lm).toISOString() : new Date(0).toISOString();
    };
    // -----------------------------

    const allPosts: Array<{
      title: string;
      description: string;
      slug: string;
      collection: string;
      heroImage: string | null;
      heroImageAlt: string;
      lastModified: string;
    }> = [];

    for (const collection of collectionsToSearch) {
      const entries = await getCollection(collection as keyof DataEntryMap);

      for (const entry of entries) {
        if (isHiddenEntry(entry)) continue;

        const authors = (entry.data as any)?.authors;
        if (!authorMatches(authors, slug)) continue;

        const title = (entry.data as any)?.title ?? 'Untitled';
        const description = (entry.data as any)?.description ?? '';
        const runtimeSlug = getRuntimeSlug(entry);

        allPosts.push({
          title,
          description,
          slug: runtimeSlug,
          collection: entry.collection,
          heroImage: (entry.data as any)?.heroImage ?? null,
          heroImageAlt: (entry.data as any)?.heroImageAlt ?? title,
          lastModified: getLastModified(entry),
        });
      }
    }

    // sort
    const sortedPosts = allPosts.sort((a, b) => {
      if (sort === 'lastmodified') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return 0;
    });

    // paginate
    const limit = offset;
    const sliced = sortedPosts.slice(loaded, loaded + limit);
    const hasMore = loaded + sliced.length < sortedPosts.length;

    return new Response(JSON.stringify({ posts: sliced, hasMore }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
        'Access-Control-Allow-Origin': origin || '',
        Vary: 'Origin',
      },
    });
  } catch (err) {
    console.error('[posts-by-author] Internal error:', err);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
