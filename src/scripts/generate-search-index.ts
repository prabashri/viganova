import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { htmlToText } from 'html-to-text';
import { siteDefaults } from '../config/siteDefaults';

const OUTPUT_PATH = './public/search-index.json';
const contentDir = path.resolve('./src/content');
const TOLERANCE_MS = 10; // Ignore mtime differences smaller than this

function isSameLastModified(oldTime: number, newTime: number): boolean {
  return Math.abs((oldTime ?? 0) - newTime) < TOLERANCE_MS;
}

function makeKey(slug: string, collection: string) {
  return `${collection}::${slug}`;
}

async function generateSearchIndex() {
  const allIndexEntries: any[] = [];

  // Load existing index (for diff check)
  let previousIndex: Record<string, any> = {};
  try {
    const raw = await fs.readFile(OUTPUT_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    for (const item of parsed) {
      previousIndex[makeKey(item.slug, item.collection)] = item;
    }
  } catch {
    previousIndex = {};
  }

  for (const [collectionName, config] of Object.entries(siteDefaults.collections)) {
    if (!config.search) continue;

    const basePath = config.base ?? collectionName;
    const collectionPath = path.join(contentDir, collectionName);

    let files: string[] = [];
    try {
      files = await fs.readdir(collectionPath);
    } catch {
      console.warn(`⚠️ Collection folder missing: ${collectionPath}`);
      continue;
    }

    for (const file of files) {
      if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;

      const fullPath = path.join(collectionPath, file);
      const fileStat = await fs.stat(fullPath);
      const fileModified = Math.floor(fileStat.mtimeMs);

      const rawContent = await fs.readFile(fullPath, 'utf-8');
      const { data, content } = matter(rawContent);
      if (data.draft || data.index === false) continue;

      const slug = data.slug || file.replace(/\.mdx?$/, '');
      const url = data.canonicalUrl || `/${basePath}/${slug}/`;
      const key = makeKey(slug, collectionName);

      const previous = previousIndex[key];
      if (previous && isSameLastModified(previous.lastModified, fileModified)) {
        allIndexEntries.push(previous); // reuse
        continue;
      }

      const parsed = await unified()
        .use(remarkParse)
        .use(remarkMdx)
        .use(remarkStringify)
        .process(content);

      const plainText = htmlToText(parsed.toString(), {
        wordwrap: false,
        selectors: [{ selector: 'a', options: { ignoreHref: true } }],
      });

      allIndexEntries.push({
        title: data.title,
        description: data.description,
        tags: data.tags || [],
        authors: (data.authors || []).map((a: any) => a.id ?? a),
        lastModified: fileModified,
        content: plainText,
        url,
        slug,
        collection: collectionName,
      });
    }
  }

  // Skip write if unchanged
  const previousKeys = Object.keys(previousIndex);
  if (previousKeys.length === allIndexEntries.length) {
    let isSame = true;
    for (const entry of allIndexEntries) {
      const old = previousIndex[makeKey(entry.slug, entry.collection)];
      if (!old || old.lastModified !== entry.lastModified) {
        isSame = false;
        break;
      }
    }

    if (isSame) {
      console.log('✅ No changes in content. Search index not updated.');
      return;
    }
  }

  // Write minified search index
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(allIndexEntries));
  const jsonBuffer = Buffer.from(JSON.stringify(allIndexEntries));
  const kbSize = (jsonBuffer.length / 1024).toFixed(2);

  if (Number(kbSize) > 100) {
    console.warn(`⚠️ Search index is ${kbSize} KB — consider reducing indexed fields.`);
  }

  console.log(`✅ Search index written to ${OUTPUT_PATH} (${allIndexEntries.length} items, ${kbSize} KB)`);
}

generateSearchIndex();
