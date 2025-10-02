// src/pages/videos/rss.xml.ts
import { buildCollectionRss } from '@/utils/rss';

export const GET = () =>
  buildCollectionRss({
    collectionKey: 'videos',
    label: 'Videos',
    description: 'Latest video uploads & watch pages',
    useModifiedMap: false, // videos usually aren’t in modified-dates.json
    dateResolver: (e) =>
      e.data.updatedDate || e.data.publishDate || e.data.uploadDate || new Date(0).toISOString(),
  });
