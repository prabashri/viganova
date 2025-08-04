import { getCollection } from 'astro:content';
import { siteDefaults } from '../config/siteDefaults';
import modifiedDatesJson from '../data/modified-dates.json';
import imageData from '../data/image-format-details.json';

const modifiedDates: { [key: string]: string } = modifiedDatesJson;

// ✅ Helper: Safely get last modified date
function getLastModified(slug: string, base?: string): string {
  const key = base ? `${base}/${slug}` : slug;
  return (
    modifiedDates[key] ||
    modifiedDates[slug] ||
    new Date().toISOString()
  );
}

// ✅ Helper: Convert filename → readable title
function filenameToTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/-/g, ' ');
}

export async function GET() {
  const entries: string[] = [];
  const allPosts: any[] = [];

  // ✅ Loop collections for pages/posts
  for (const [key, config] of Object.entries(siteDefaults.collections) as [
    keyof typeof siteDefaults.collections,
    any
  ][]) {
    if (!config.index || config.sitemap === false) continue;

    const items = await getCollection(key, ({ data }) =>
      data.index !== false &&
      !(typeof data.slug === 'string' && data.slug.startsWith('_')) &&
      (!('draft' in data) || !data.draft)
    );

    allPosts.push(...items);

    for (const entry of items) {
      const basePath = config.base ? `/${config.base}` : '';
      const urlSlug = entry.id.endsWith('/') ? entry.id : `${entry.id}/`;
      const url = `${siteDefaults.siteUrl}${basePath ? `${basePath}/` : '/'}${urlSlug}`;
      const lastmod = getLastModified(entry.id, config.base);

      entries.push(`
<url>
  <loc>${url}</loc>
  <lastmod>${lastmod}</lastmod>
</url>`);
    }
  }

  // ✅ Tags
  if (siteDefaults.fieldCollections.tags) {
    const tagMetaModule = await import(`../config/${siteDefaults.fieldCollections.tags.meta}.ts`);
    const tagMetaList = tagMetaModule.default || [];
    const minPosts = siteDefaults.fieldCollections.tags.sitemapMinPosts || 5;

    const tagCountMap = new Map();
    for (const post of allPosts) {
      if (Array.isArray(post.data.tags)) {
        (post.data.tags as string[]).forEach((tag: string) => {
          tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
        });
      }
    }

    for (const tagItem of tagMetaList) {
      if (tagItem.sitemap === false) continue;
      const tagSlug = tagItem.slug || tagItem.name.toLowerCase().replace(/\s+/g, '-');
      const count = tagCountMap.get(tagSlug) || 0;

      if (count >= minPosts) {
        entries.push(`
<url>
  <loc>${siteDefaults.siteUrl}/tags/${tagSlug}/</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
</url>`);
      }
    }
  }

  // ✅ Categories
  if (siteDefaults.fieldCollections.categories) {
    const categoryMetaModule = await import(`../config/${siteDefaults.fieldCollections.categories.meta}.ts`);
    const categoryMetaList = categoryMetaModule.default || [];
    const minPosts = siteDefaults.fieldCollections.categories.sitemapMinPosts || 5;

    const categoryCountMap = new Map();
    for (const post of allPosts) {
      if (Array.isArray(post.data.categories)) {
        (post.data.categories as string[]).forEach((cat: string) => {
          categoryCountMap.set(cat, (categoryCountMap.get(cat) || 0) + 1);
        });
      }
    }

    for (const catItem of categoryMetaList) {
      if (catItem.sitemap === false) continue;
      const catSlug = catItem.slug || catItem.name.toLowerCase().replace(/\s+/g, '-');
      const count = categoryCountMap.get(catSlug) || 0;

      if (count >= minPosts) {
        entries.push(`
<url>
  <loc>${siteDefaults.siteUrl}/categories/${catSlug}/</loc>
  <lastmod>${new Date().toISOString()}</lastmod>
</url>`);
      }
    }
  }

  // ✅ Images (largest webp only, default to homepage for <loc>)
  for (const [fileName, details] of Object.entries(imageData)) {
    const cleanName = fileName.replace(/\.[^.]+$/, '');
    const title = filenameToTitle(fileName);
    const largestVariant = Math.max(...details.variants.map(Number));
    const imageUrl = `${siteDefaults.siteUrl}/images${details.path}${cleanName}-w${largestVariant}-a${details.aspect}.webp`;

    entries.push(`
<url>
  <loc>${siteDefaults.siteUrl}/</loc>
  <image:image xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <image:loc>${imageUrl}</image:loc>
    <image:title>${title}</image:title>
  </image:image>
</url>`);
  }

  // ✅ Final XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
}
