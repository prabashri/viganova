// src/utils/write-manifest.ts
import fs from 'fs/promises';
import path from 'path';

const manifestPath = path.resolve('./src/data/assets-manifest.json');

type ManifestType = 'js' | 'css';
type ManifestData = Record<ManifestType, Record<string, { file: string } & Record<string, any>>>;

/**
 * Read the JSON manifest from file.
 */
export async function readManifest(): Promise<ManifestData> {
  try {
    const content = await fs.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  } catch {
    return { js: {}, css: {} };
  }
}

/**
 * Write or update a single entry in the manifest.
 */
export async function writeManifestEntry(
  type: ManifestType,
  key: string,
  file: string,
  extra: Record<string, any> = {}
): Promise<void> {
  const manifest = await readManifest();

  if (!manifest[type]) {
    manifest[type] = {};
  }

  manifest[type][key] = { file, ...extra };

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}
