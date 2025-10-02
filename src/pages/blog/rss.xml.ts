// src/pages/blog/rss.xml.ts
import { buildCollectionRss } from '@/utils/rss';
export const GET = () =>
  buildCollectionRss({ collectionKey: 'blog', label: 'Blog', description: `Latest blog updates from EasyApostille` });
