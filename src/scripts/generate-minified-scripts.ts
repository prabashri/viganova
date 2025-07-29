// src/scripts/generate-minified-scripts.mjs
import fs from 'fs/promises';
import path from 'path';
import { build } from 'esbuild';
import { writeManifestEntry, readManifest } from '../utils/write-manifest.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptsDir = path.resolve(__dirname, '../../public/scripts');
const manifestPath = path.resolve(__dirname, '../../src/data/assets-manifest.json');

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

async function syncManifestJsEntries() {
  const manifest = await readManifest();
  const files = await fs.readdir(scriptsDir);
  const jsFiles = files.filter(f => f.endsWith('.js') && !f.endsWith('.min.js'));
  const manifestKeys = Object.keys(manifest.js || {});

  const added = [];
  const removed = [];

  // Add missing entries
  for (const file of jsFiles) {
    const base = path.basename(file, '.js');
    if (!manifestKeys.includes(base)) {
      added.push(base);
    }
  }

  // Remove stale entries
  for (const key of manifestKeys) {
    if (!jsFiles.includes(`${key}.js`)) {
      delete manifest.js[key];
      removed.push(key);
    }
  }

  if (added.length || removed.length) {
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log(`🔄 Manifest synced. Added: ${added.join(', ')}, Removed: ${removed.join(', ')}`);
  }

  return { jsFiles, added, removed };
}

interface DeleteOldVariants {
  (base: string): Promise<void>;
}

const deleteOldVariants: DeleteOldVariants = async function (base: string): Promise<void> {
  const files: string[] = await fs.readdir(scriptsDir);
  const regex: RegExp = new RegExp(`^${base}\\.[a-z0-9]{6}\\.min\\.js$`);
  const toDelete: string[] = files.filter((f: string) => regex.test(f));
  await Promise.allSettled(toDelete.map((f: string) => fs.unlink(path.join(scriptsDir, f))));
};

async function buildScripts() {
  const manifest = await readManifest();
  const { jsFiles } = await syncManifestJsEntries();

  for (const file of jsFiles) {
    const base = path.basename(file, '.js');
    const srcPath = path.join(scriptsDir, file);

    const stat = await fs.stat(srcPath);
    const lastManifestTime = manifest.js?.[base]?.datetime
      ? new Date(manifest.js[base].datetime)
      : new Date(0);

    if (stat.mtime <= lastManifestTime) {
      console.log(`✅ ${file} unchanged. Skipping.`);
      continue;
    }

    // Delete old hashed file
    await deleteOldVariants(base);

    const id = generateId();
    const outputName = `${base}.${id}.min.js`;
    const outputPath = path.join(scriptsDir, outputName);

    await build({
      entryPoints: [srcPath],
      minify: true,
      bundle: false, // Keep separate files
      format: 'iife', // Isolated scope
      target: ['es2017'],
      outfile: outputPath,
      banner: { js: `(() => {` },
      footer: { js: `})();` }
    });

    await writeManifestEntry('js', base, `/scripts/${outputName}`, {
      datetime: new Date().toISOString()
    });

    console.log(`🆕 Minified: ${outputName}`);
  }
}

buildScripts().catch(console.error);
