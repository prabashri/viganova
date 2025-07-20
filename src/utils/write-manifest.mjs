import fs from 'fs/promises';
import path from 'path';

const manifestFile = path.resolve('./src/data/assets-manifest.json');

/**
 * Merge and write asset info into unified manifest.json
 * @param {'css' | 'js'} type - Top-level key
 * @param {string} key - Asset name (e.g., 'main', 'inline')
 * @param {string} filePath - Public file path (e.g., /styles/main.abc123.min.css)
 */
export async function writeManifestEntry(type, key, filePath) {
  let manifest = {};

  try {
    const data = await fs.readFile(manifestFile, 'utf8');
    manifest = JSON.parse(data);
  } catch {
    manifest = {};
  }

  if (!manifest[type]) manifest[type] = {};

  manifest[type][key] = {
    file: filePath,
    datetime: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(manifestFile), { recursive: true });
  await fs.writeFile(manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
}