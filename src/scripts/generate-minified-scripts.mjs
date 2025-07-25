// src/scripts/generate-minified-scripts.mjs
import fs from 'fs/promises';
import path from 'path';
import { build } from 'esbuild';
import { writeManifestEntry } from '../utils/write-manifest.mjs';

const scriptsDir = path.resolve('./public/scripts');
const manifestPath = path.resolve('./src/data/assets-manifest.json');
const TOLERANCE_MS = 2 * 60 * 1000;

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

async function readManifestMtime() {
  try {
    const stat = await fs.stat(manifestPath);
    return stat.mtime;
  } catch {
    return new Date(0); // Assume fresh build
  }
}

async function deleteOldVariants(baseName) {
  try {
    const files = await fs.readdir(scriptsDir);
    const pattern = new RegExp(`^${baseName}\\.[a-z0-9]{6}\\.min\\.js$`);
    const toDelete = files.filter(f => pattern.test(f));
    await Promise.allSettled(toDelete.map(f => fs.unlink(path.join(scriptsDir, f))));
  } catch (err) {
    console.warn(`⚠️ Failed cleanup for ${baseName}: ${err.message}`);
  }
}

async function processScripts() {
  try {
    const dirExists = await fs.stat(scriptsDir).then(stat => stat.isDirectory()).catch(() => false);
    if (!dirExists) {
      console.log('🚫 Skipping: public/scripts folder does not exist.');
      return;
    }

    const files = await fs.readdir(scriptsDir);
    const jsFiles = files.filter(f => f.endsWith('.js') && !/\.min\.js$/.test(f));
    if (!jsFiles.length) {
      console.log('📁 No input JS files found. Skipping.');
      return;
    }

    const manifestMtime = await readManifestMtime();
    const now = new Date();

    for (const file of jsFiles) {
      const fullPath = path.join(scriptsDir, file);
      const baseName = path.basename(file, '.js');

      try {
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

        console.log(`🆕 Built ${outputName}`);

      } catch (err) {
        console.warn(`⚠️ Skipped ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Unhandled error: ${err.message}`);
  }
}

processScripts();
