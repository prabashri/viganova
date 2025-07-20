// src/scripts/generate-main-css.mjs
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry } from '../utils/write-manifest.mjs';

const preloadDir = path.resolve('./src/styles/preload');
const outputDir = path.resolve('./public/styles');
const manifestPath = path.resolve('./src/data/assets-manifest.json');

const getRandomId = () => Math.random().toString(36).slice(2, 8);

async function loadManifest() {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function minifyFile(code, fileName) {
  try {
    const result = transform({
      filename: fileName,
      code: Buffer.from(code),
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
      },
    });
    return result.code.toString();
  } catch (err) {
    const line = err?.loc?.line ? ` at line ${err.loc.line}` : '';
    const column = err?.loc?.column ? `, column ${err.loc.column}` : '';
    console.error(`❌ Error in ${fileName}${line}${column}`);
    console.error(`→ ${err.message}\n`);
    return null;
  }
}

async function deleteOldMainVariants() {
  const files = await fs.readdir(outputDir);
  const regex = /^main\.[a-z0-9]{6}\.css$/i;
  const toDelete = files.filter(f => regex.test(f));
  await Promise.allSettled(toDelete.map(f => fs.unlink(path.join(outputDir, f))));
}

async function buildMainCSS() {
  const files = await fs.readdir(preloadDir);
  const cssFiles = files.filter(f => f.endsWith('.css'));
  if (cssFiles.length === 0) {
    console.log('⚠️ No preload CSS files found.');
    return;
  }

  const manifest = await loadManifest();
  let combinedCss = '';
  let rebuildNeeded = false;

  // ⏱️ Check if rebuild is needed
  for (const file of cssFiles) {
    const srcPath = path.join(preloadDir, file);
    const stat = await fs.stat(srcPath);
    const lastModified = stat.mtime;
    const prevDate = manifest?.preload?.[file]?.datetime
      ? new Date(manifest.preload[file].datetime)
      : new Date(0);

    if (lastModified > prevDate) {
      rebuildNeeded = true;
      break;
    }
  }

  if (!rebuildNeeded) {
    console.log('✅ main.css is up-to-date. No rebuild needed.');
    return;
  }

  // ✂️ Minify and combine
  for (const file of cssFiles) {
    const srcPath = path.join(preloadDir, file);
    const raw = await fs.readFile(srcPath, 'utf8');
    const minified = await minifyFile(raw, file);
    if (!minified) continue;

    combinedCss += `/* ${file} */\n${minified}\n`;

    // Save updated timestamp for manifest
    await writeManifestEntry('preload', file, srcPath);
  }

  // 🧱 Output combined file
  const randomId = getRandomId();
  const hashedFileName = `main.${randomId}.css`;
  const hashedFilePath = path.join(outputDir, hashedFileName);

  await fs.mkdir(outputDir, { recursive: true });
  await deleteOldMainVariants();
  await fs.writeFile(hashedFilePath, combinedCss, 'utf8');
  await writeManifestEntry('css', 'main', `/styles/${hashedFileName}`);

  console.log(`\n✅ Main CSS built:`);
  console.log(`- ${hashedFileName}`);
}

buildMainCSS().catch(console.error);
