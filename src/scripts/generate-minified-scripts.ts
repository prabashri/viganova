// src/scripts/generate-minified-scripts.mjs
import fs from 'fs/promises';
import path from 'path';
import { build } from 'esbuild';
import { writeManifestEntry, readManifest } from '../utils/write-manifest'; // Adjust if needed
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const scriptsDir = path.resolve(__dirname, '../../public/scripts');
const manifestPath = path.resolve(__dirname, '../../src/data/assets-manifest.json');
const TOLERANCE_MS = 2 * 60 * 1000;

function generateId(): string {
  return Math.random().toString(36).slice(2, 8);
}

async function readManifestMtime(): Promise<Date> {
  try {
    const stat = await fs.stat(manifestPath);
    return stat.mtime;
  } catch {
    return new Date(0);
  }
}

async function deleteOldVariants(baseName: string) {
  try {
    const files = await fs.readdir(scriptsDir);
    const pattern = new RegExp(`^${baseName}\\.[a-z0-9]{6}\\.min\\.js$`);
    const toDelete = files.filter((f) => pattern.test(f));
    await Promise.allSettled(toDelete.map((f) => fs.unlink(path.join(scriptsDir, f))));
  } catch (err) {
    console.warn(`⚠️ Failed to clean up old variants for ${baseName}:`, err);
  }
}

async function cleanRemovedManifestEntries(manifest: any, actualFiles: string[]) {
  const validKeys = new Set(actualFiles.map(f => f.replace(/\.js$/, '')));
  if (!manifest.js) return;

  for (const [key, value] of Object.entries(manifest.js)) {
    const entry = value as { file: string };
    const filename = entry.file?.split('/').pop() || '';
    const base = filename.replace(/\.[a-z0-9]{6}\.min\.js$/, '');

    if (!validKeys.has(base)) {
      delete manifest.js[key];
      console.log(`🧹 Removed stale manifest entry: ${key}`);
    }
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

async function processScripts() {
  const manifestMtime = await readManifestMtime();
  const now = new Date();

  try {
    const dirExists = await fs.stat(scriptsDir).then((stat) => stat.isDirectory()).catch(() => false);
    if (!dirExists) {
      console.log('🚫 public/scripts folder not found.');
      return;
    }

    const allFiles = await fs.readdir(scriptsDir);
    const jsFiles = allFiles.filter((f) => f.endsWith('.js') && !f.endsWith('.min.js'));

    const manifest = await readManifest();

    await cleanRemovedManifestEntries(manifest, jsFiles);

    for (const file of jsFiles) {
      const fullPath = path.join(scriptsDir, file);
      const baseName = path.basename(file, '.js');

      const stat = await fs.stat(fullPath);
      const modified = new Date(stat.mtime);
      if (modified <= new Date(manifestMtime.getTime() + TOLERANCE_MS)) {
        console.log(`✅ ${file} unchanged. Skipping.`);
        continue;
      }

      const id = generateId();
      const outputName = `${baseName}.${id}.min.js`;
      const outputPath = path.join(scriptsDir, outputName);

      await deleteOldVariants(baseName);

      await build({
        entryPoints: [fullPath],
        minify: true,
        bundle: false,
        outfile: outputPath,
      });

      await writeManifestEntry('js', baseName, `/scripts/${outputName}`, {
        datetime: now.toISOString(),
      });

      console.log(`🆕 Minified: ${outputName}`);
    }

  } catch (err) {
    console.error(`❌ Error:`, err);
  }
}

processScripts();
