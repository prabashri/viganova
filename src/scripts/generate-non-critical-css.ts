// src/scripts/generate-non-critical-css.mjs
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry } from '../utils/write-manifest';

const sourceDir = path.resolve('./src/styles/non-critical');
const outputDir = path.resolve('./public/styles');
const manifestPath = path.resolve('./src/data/assets-manifest.json');

const getRandomId = (): string => Math.random().toString(36).slice(2, 8);

async function getManifestNonCriticalDatetime(): Promise<Date> {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);
    const datetime = manifest?.css?.nonCritical?.datetime;
    return datetime ? new Date(datetime) : new Date(0);
  } catch {
    return new Date(0);
  }
}

async function deleteOldNonCriticalVariants(): Promise<void> {
  try {
    const files = await fs.readdir(outputDir);
    const regex = /^non-critical\.[a-z0-9]{6}\.min\.css$/i;
    const toDelete = files.filter((f) => regex.test(f));
    await Promise.allSettled(toDelete.map((f) => fs.unlink(path.join(outputDir, f))));
  } catch (err) {
    console.warn('⚠️ Error cleaning old variants:', err);
  }
}

async function buildNonCriticalCSS(): Promise<void> {
  const exists = await fs.readdir(sourceDir).catch(() => []);
  const cssFiles = exists.filter((f) => f.endsWith('.css'));

  if (cssFiles.length === 0) {
    console.log('ℹ️ No non-critical CSS files found.');
    return;
  }

  const manifestTime = await getManifestNonCriticalDatetime();
  let shouldRebuild = false;

  for (const file of cssFiles) {
    const stat = await fs.stat(path.join(sourceDir, file));
    if (stat.mtime > manifestTime) {
      shouldRebuild = true;
      break;
    }
  }

  if (!shouldRebuild) {
    console.log('✅ non-critical.css is up-to-date. No rebuild needed.');
    return;
  }

  let combinedCss = '';
  for (const file of cssFiles) {
    const content = await fs.readFile(path.join(sourceDir, file), 'utf8');
    combinedCss += `\n/* ${file} */\n${content}`;
  }

  const { code: minified } = transform({
  filename: 'non-critical.css',
  code: Buffer.from(combinedCss),
  minify: true,
  targets: {
    chrome: 100,
    firefox: 100,
    safari: 15,
    edge: 100,
  },
  drafts: {
    nesting: true,
    customMedia: true,
  } as unknown as Record<string, boolean>, // ✅ cast to bypass TS error
});


  const randomId = getRandomId();
  const hashedName = `non-critical.${randomId}.min.css`;

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(path.join(outputDir, 'non-critical.css'), combinedCss, 'utf8');

  await deleteOldNonCriticalVariants();
  await fs.writeFile(path.join(outputDir, hashedName), minified, 'utf8');

  await writeManifestEntry('css', 'nonCritical', `/styles/${hashedName}`, {
    datetime: new Date().toISOString(),
  });

  console.log(`✅ Non-critical CSS built:`);
  console.log(`- non-critical.css`);
  console.log(`- ${hashedName}`);
}

buildNonCriticalCSS().catch(console.error);
