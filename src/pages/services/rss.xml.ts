// src/pages/services/rss.xml.ts
import { buildCollectionRss } from '@/utils/rss';
export const GET = () =>
  buildCollectionRss({ collectionKey: 'service', label: 'Services', description: `Latest service updates from EasyApostille` });
