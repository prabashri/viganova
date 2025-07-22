// src/pages/posts/rss.xml.ts
// This file generates the RSS feed for the 'post' collection
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteDefaults } from '../../config/siteDefaults';
import modifiedDates from '../../data/modified-dates.json';

interface CollectionConfig {
  index?: boolean;
  rss?: boolean;
  base?: string;
}

interface PostData {
  title: string;
  description: string;
  publishedDate: string;
  draft?: boolean;
  index?: boolean;
  slug?: string;
}

interface Post {
  id: string;
  data: PostData;
  collection: string;
}

interface ModifiedDates {
  [key: string]: string;
}

export async function GET(context: any): Promise<Response> {
  // 🔒 Global RSS disabled
  if (siteDefaults.rss !== true) {
    return new Response(null, { status: 204 });
  }

  const collectionKey = 'post';
  const config = siteDefaults.collections[collectionKey];

  // 🔒 Collection-level RSS disabled
  if (!config?.index || config?.rss === false) {
    return new Response(null, { status: 404 });
  }

  // 📦 Fetch entries
  const entries = await getCollection(collectionKey);
  const posts = entries
    .filter(post =>
      !post.id.startsWith('0-example-') &&
      post.data.draft !== true &&
      post.data.index !== false
    )
    .sort(
      (a, b) =>
        new Date(b.data.publishedDate).valueOf() -
        new Date(a.data.publishedDate).valueOf()
    );

  const base = config.base ?? '';

  return rss({
    title: `${siteDefaults.siteName} | Posts`,
    description: `Latest post updates from ${siteDefaults.siteName}`,
    site: siteDefaults.siteUrl,
    items: posts.map(post => {
      const slug = post.data.slug ?? post.id;
      const url = base ? `/${base}/${slug}/` : `/${slug}/`;
      const modifiedKey = `${collectionKey}/${slug}`;
      const pubDate = new Date((modifiedDates as Record<string, string>)[modifiedKey] || post.data.publishedDate);

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate,
        link: url,
      };
    }),
  });
}