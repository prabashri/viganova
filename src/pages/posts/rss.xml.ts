// src/pages/posts/rss.xml.ts
import { buildCollectionRss } from '@/utils/rss';

export const GET = () =>
  buildCollectionRss({
    collectionKey: 'post',            // change if your key differs
    label: 'Posts',
    description: `Latest post updates from EasyApostille`,
  });
