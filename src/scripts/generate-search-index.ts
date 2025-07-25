// src/scripts/generate-search-index.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkStringify from 'remark-stringify';
import { htmlToText } from 'html-to-text';
import { siteDefaults } from '../config/siteDefaults';
import { writeManifestEntry } from '../utils/write-manifest.mjs';

const manifestPath = path.resolve('./src/data/assets-manifest.json');
const outputDir = path.resolve('./public');
const versionedFilePrefix = 'search-index';
const TOLERANCE_MS = 10;

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

function isSameLastModified(oldTime: number, newTime: number): boolean {
  return Math.abs((oldTime ?? 0) - newTime) < TOLERANCE_MS;
}

function makeKey(slug: string, collection: string) {
  return `${collection}::${slug}`;
}

function normalizeUrl(base: string, slug: string): string {
  const parts = [base, slug].filter(Boolean).map(p => p.replace(/^\/|\/$/g, ''));
  return '/' + parts.join('/') + '/';
}

async function getPreviousManifest(): Promise<Record<string, any>> {
  try {
    const data = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function getPreviousVersionedFilename(): Promise<string | null> {
  const manifest = await getPreviousManifest();
  return manifest?.js?.[versionedFilePrefix]?.file?.replace(/^\//, '') ?? null;
}

async function deleteOldSearchIndexes(exclude: string) {
  const files = await fs.readdir(outputDir);
  const regex = new RegExp(`^${versionedFilePrefix}\\.[a-z0-9]{6}\\.json$`);
  const toDelete = files.filter(f => regex.test(f) && f !== exclude);
  await Promise.allSettled(toDelete.map(f => fs.unlink(path.join(outputDir, f))));
}

async function generateSearchIndex() {
  const allIndexEntries: any[] = [];
  let previousIndex: Record<string, any> = {};
  const previousFileName = await getPreviousVersionedFilename();
  const previousFilePath = previousFileName ? path.join(outputDir, previousFileName) : null;

  // Load previous data to skip unchanged entries
  try {
    if (previousFilePath) {
      const raw = await fs.readFile(previousFilePath, 'utf-8');
      for (const item of JSON.parse(raw)) {
        previousIndex[makeKey(item.slug, item.collection)] = item;
      }
    }
  } catch {
    previousIndex = {};
  }

  for (const [collectionName, config] of Object.entries(siteDefaults.collections)) {
    if (!config.search) continue;

    const basePath = config.base ?? collectionName;
    const collectionPath = path.join('./src/content', collectionName);

    let files: string[] = [];
    try {
      files = await fs.readdir(collectionPath);
    } catch {
      console.warn(`⚠️ Missing collection folder: ${collectionPath}`);
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
      const url = normalizeUrl(basePath, slug);
      const key = makeKey(slug, collectionName);

      const previous = previousIndex[key];
      if (previous && isSameLastModified(previous.lastModified, fileModified)) {
        allIndexEntries.push(previous);
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

  // Compare with previous
  const previousKeys = Object.keys(previousIndex);
  const isUnchanged = previousKeys.length === allIndexEntries.length &&
    allIndexEntries.every(entry => {
      const old = previousIndex[makeKey(entry.slug, entry.collection)];
      return old && old.lastModified === entry.lastModified;
    });

  if (isUnchanged && previousFileName) {
    console.log(`✅ No changes. Keeping existing search index: ${previousFileName}`);
    return;
  }

  // Write new versioned search-index.[id].json
  const id = generateId();
  const newFileName = `${versionedFilePrefix}.${id}.json`;
  const newPath = path.join(outputDir, newFileName);

  const json = JSON.stringify(allIndexEntries);
  await fs.writeFile(newPath, json);
  await writeManifestEntry('js', versionedFilePrefix, `/${newFileName}`);

  await deleteOldSearchIndexes(newFileName);

  const kb = (Buffer.byteLength(json) / 1024).toFixed(2);
  if (Number(kb) > 100) {
    console.warn(`⚠️ Search index is ${kb} KB — consider reducing fields.`);
  }

  console.log(`🆕 Updated: ${newFileName} (${allIndexEntries.length} items, ${kb} KB)`);

  // 🔁 Update fetch path in search-client.js
  const searchClientPath = path.join('./public/scripts/search-client.js');
  try {
    let content = await fs.readFile(searchClientPath, 'utf8');
    content = content.replace(
      /const\s+searchIndex\s*=\s*["'][^"']+["'];/,
      `const searchIndex = "/${newFileName}";`
    );
    await fs.writeFile(searchClientPath, content, 'utf8');
    console.log(`🔁 Updated search-client.js to use new index: ${newFileName}`);
  } catch (err) {
    console.warn(`⚠️ Could not patch search-client.js: ${(err instanceof Error ? err.message : String(err))}`);
  }
}

generateSearchIndex();
