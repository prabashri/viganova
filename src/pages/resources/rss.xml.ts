// src/pages/resources/rss.xml.ts
import { buildCollectionRss } from '@/utils/rss';

export const GET = () =>
  buildCollectionRss({
    collectionKey: 'resource',            // change if your key differs
    label: 'Resources',
    description: `Latest resource articles & guides from EasyApostille`,
  });
