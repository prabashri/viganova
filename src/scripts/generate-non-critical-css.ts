// src/scripts/generate-non-critical-css.ts
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry } from '../utils/write-manifest';

const sourceDir = path.resolve('./src/styles-css/non-critical');
const outputDir = path.resolve('./public/styles');
const manifestKey = 'nonCritical';

const getRandomId = (): string => Math.random().toString(36).slice(2, 8);

async function getManifestNonCriticalDatetime(): Promise<Date> {
  try {
    const manifestRaw = await fs.readFile(path.resolve('./src/data/assets-manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);
    const datetime = manifest?.css?.[manifestKey]?.datetime;
    return datetime ? new Date(datetime) : new Date(0);
  } catch {
    return new Date(0);
  }
}

async function deleteOldNonCriticalVariants(): Promise<void> {
  try {
    const files = await fs.readdir(outputDir);
    const regex = /^non-critical\.[a-z0-9]{6}\.css$/i;
    const toDelete = files.filter(f => regex.test(f));
    await Promise.allSettled(
      toDelete.map(f => fs.unlink(path.join(outputDir, f)))
    );
  } catch (err) {
    console.warn('⚠️ Error cleaning old variants:', err);
  }
}

async function buildNonCriticalCSS(): Promise<void> {
  const exists = await fs.readdir(sourceDir).catch(() => []);
  const cssFiles = exists.filter(f => f.endsWith('.css'));

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
    console.log('✅ Non-critical CSS is up-to-date. No rebuild needed.');
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
      customMedia: true,
    }
  });

  const randomId = getRandomId();
  const hashedName = `non-critical.${randomId}.css`;

  await fs.mkdir(outputDir, { recursive: true });

  await deleteOldNonCriticalVariants();
  await fs.writeFile(path.join(outputDir, hashedName), minified, 'utf8');

  await writeManifestEntry('css', manifestKey, `/styles/${hashedName}`, {
    datetime: new Date().toISOString(),
  });

  console.log(`✅ Non-critical CSS built: ${hashedName}`);
}

buildNonCriticalCSS().catch(console.error);
