// src/pages/api/posts-by-author.ts
/**
 * API Endpoint to fetch posts by author
 * Supports filtering by multiple collections
 * Returns posts with pagination and sorting options
 * @route /api/posts-by-author
 * @method GET
 * @queryParam slug - Author slug to filter posts
 * @queryParam offset - Number of posts to skip (default: 6)
 * @queryParam loaded - Number of posts already loaded (default: 0)
 * @queryParam sort - Sorting criteria (default: lastmodified)
 *  @queryParam total - Total expected posts (for pagination)
 * @queryParam collections - Comma-separated list of collections to search (default: blog,post)
 * @returns JSON with posts and pagination info
 * @response 200 - List of posts by the author
 * @response 400 - Bad request if slug is missing or invalid
 */
import { getCollection } from 'astro:content';
import type { DataEntryMap } from 'astro:content';

export async function GET({ url, request }: { url: URL; request: Request }) {
  const origin = request.headers.get('origin') || '';
  const host = request.headers.get('host') || '';

  try {
    // ✅ Restrict to same-origin requests
    if (origin && new URL(origin).hostname !== host) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const slug = url.searchParams.get('slug');
    const offset = Number(url.searchParams.get('offset') || '6');
    const loaded = Number(url.searchParams.get('loaded') || '0');
    const sort = url.searchParams.get('sort') || 'lastmodified';
    const totalExpected = Number(url.searchParams.get('total') || '0');
    const limit = offset;

    if (!slug || typeof slug !== 'string') {
      return new Response(JSON.stringify({ posts: [], hasMore: false }), { status: 400 });
    }

    // ✅ Allow multiple collection filters via ?collections=blog&collections=post
    const collectionsParam = url.searchParams.getAll('collections');
    
    const collectionsToSearch = collectionsParam.length > 0 ? collectionsParam : ['blog', 'post'];

    const allPosts: {
      title: string;
      description: string;
      slug: string;
      collection: string;
      heroImage: string | null;
      heroImageAlt: string;
      lastModified: string;
    }[] = [];

    for (const collection of collectionsToSearch) {
      const entries = await getCollection(collection as keyof DataEntryMap);

      for (const entry of entries) {
        const isDraft = 'draft' in entry.data && entry.data.draft === true;
        const isHidden = entry.id.startsWith('_') || (('slug' in entry.data) && (entry.data as any).slug?.startsWith('_'));

        if (isDraft || isHidden) continue;

        let matchesAuthor = false;
        if ('authors' in entry.data && Array.isArray(entry.data.authors)) {
          const authors = entry.data.authors;
          matchesAuthor =
            authors.some((a) => typeof a === 'object' && a?.id === slug);
        }

        if (matchesAuthor) {
          if ('title' in entry.data && typeof entry.data.title === 'string') {
            allPosts.push({
              title: entry.data.title ?? 'Untitled',
              description: entry.data.description ?? '',
              slug: entry.data.slug ?? '',
              collection: entry.collection,
              heroImage: (entry.data as any)?.heroImage ?? null,
              heroImageAlt: (entry.data as any)?.heroImageAlt ?? '',
              lastModified:
                ('lastModified' in entry.data && entry.data.lastModified
                  ? new Date(entry.data.lastModified).toISOString()
                  : 'publishedDate' in entry.data && entry.data.publishedDate
                  ? new Date(entry.data.publishedDate).toISOString()
                  : new Date().toISOString()
                ),
            });
          }
        }
      }
    }

    // Sort by last modified
    const sortedPosts = allPosts.sort((a, b) => {
      if (sort === 'lastmodified') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return 0;
    });

    // Pagination
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
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
