// src/pages/rss.xml.js
// This file generates the RSS feed for the site, combining entries from enabled collections.
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteDefaults } from '../config/siteDefaults';
import modifiedDates from '../data/modified-dates.json';

export async function GET(context) {
  // 🚫 RSS disabled globally
  if (siteDefaults.rss !== true) {
    return new Response(null, { status: 204 });
  }

  // ✅ Get collections with RSS enabled
  const enabledCollections = Object.entries(siteDefaults.collections)
    .filter(([_, config]) => config?.rss === true && config?.index !== false);

  // ✅ Load all entries
  const allEntries = await Promise.all(
    enabledCollections.map(([collectionName]) => getCollection(collectionName))
  );

  // ✅ Filter & sort entries
  const combinedPosts = allEntries.flat()
    .filter(post =>
      !post.id.startsWith('0-example-') &&
      post.data.draft !== true &&
      post.data.index !== false
    )
    .sort((a, b) =>
      new Date(b.data.publishedDate).valueOf() - new Date(a.data.publishedDate).valueOf()
    );

  // ✅ Generate RSS
  return rss({
    title: siteDefaults.title,
    description: siteDefaults.description,
    site: siteDefaults.siteUrl,
    items: combinedPosts.map(post => {
      const base = siteDefaults.collections[post.collection]?.base || '';
      const url = base ? `/${base}/${post.id}/` : `/${post.id}/`;

      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: new Date(modifiedDates[post.id] || post.data.publishedDate),
        link: url,
      };
    }),
  });
}
