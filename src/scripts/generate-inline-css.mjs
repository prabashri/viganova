// src/scripts/generate-inline-css.mjs
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry } from '../utils/write-manifest.mjs';

const inlineDir = path.resolve('./src/styles/inline');
const outputModule = path.resolve('./src/data/generated-inline-css.js');
const manifestPath = path.resolve('./src/data/assets-manifest.json');
const manifestKey = 'inline';
const outputPublicPath = '/src/data/generated-inline-css.js'; // used in manifest

async function getInlineManifestDatetime() {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(content);
    const datetime = manifest?.css?.[manifestKey]?.datetime;
    return datetime ? new Date(datetime) : new Date(0);
  } catch {
    return new Date(0); // fallback to epoch
  }
}

async function buildInlineModule() {
  const files = await fs.readdir(inlineDir);
  const cssFiles = files.filter(file => file.endsWith('.css'));

  if (cssFiles.length === 0) {
    console.log('⚠️ No inline CSS files found. Skipping build.');
    return;
  }

  const manifestTime = await getInlineManifestDatetime();
  let shouldRebuild = false;

  for (const file of cssFiles) {
    const filePath = path.join(inlineDir, file);
    const stat = await fs.stat(filePath);
    if (stat.mtime > manifestTime) {
      shouldRebuild = true;
      break;
    }
  }

  if (!shouldRebuild) {
    console.log('✅ Inline CSS is up-to-date. No rebuild needed.');
    return;
  }

  // Build combined + minified inline CSS
  let combinedCss = '';
  for (const file of cssFiles) {
    const content = await fs.readFile(path.join(inlineDir, file), 'utf8');
    combinedCss += `\n/* ${file} */\n${content}`;
  }

  const { code } = transform({
    filename: 'inline.css',
    code: Buffer.from(combinedCss),
    targets: {
      chrome: 100,
      firefox: 100,
      safari: 15,
      edge: 100
    },
    minify: true
  });

  const jsExport = `export const inlineCss = ${JSON.stringify(code.toString())};\n`;
  await fs.mkdir(path.dirname(outputModule), { recursive: true });
  await fs.writeFile(outputModule, jsExport, 'utf8');

  // Update manifest (datetime handled inside)
  await writeManifestEntry('css', manifestKey, outputPublicPath);

  console.log(`🆕 Inline CSS module written: ${outputModule}`);
}

buildInlineModule().catch(console.error);
