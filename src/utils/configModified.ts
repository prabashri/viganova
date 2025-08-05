import fs from 'fs';
import path from 'path';

const assetsManifestPath = path.resolve('./src/data/assets-manifest.json');

/**
 * ✅ Read the entire assets-manifest.json safely
 */
function readManifest(): Record<string, any> {
  try {
    if (fs.existsSync(assetsManifestPath)) {
      return JSON.parse(fs.readFileSync(assetsManifestPath, 'utf-8'));
    }
  } catch (err) {
    console.warn('⚠️ Could not read assets-manifest.json:', err);
  }
  return {};
}

/**
 * ✅ Save manifest back to file without disturbing other keys
 */
function writeManifest(manifest: Record<string, any>) {
  fs.mkdirSync(path.dirname(assetsManifestPath), { recursive: true });
  fs.writeFileSync(assetsManifestPath, JSON.stringify(manifest, null, 2));
}

/**
 * ✅ Get the configModified value for a given key
 */
export function getConfigModified(key: string): number {
  const manifest = readManifest();
  return manifest?.configModified?.[key] || 0;
}

/**
 * ✅ Update the configModified value for a given key
 */
export function updateConfigModified(key: string, value: number): void {
  const manifest = readManifest();

  if (!manifest.configModified) {
    manifest.configModified = {};
  }

  manifest.configModified[key] = value;
  writeManifest(manifest);

  console.log(`📦 Updated configModified.${key} = ${value} in assets-manifest.json`);
}

/**
 * ✅ Bulk update multiple keys at once
 */
export function updateConfigModifiedBulk(updates: Record<string, number>): void {
  const manifest = readManifest();

  if (!manifest.configModified) {
    manifest.configModified = {};
  }

  for (const [key, value] of Object.entries(updates)) {
    manifest.configModified[key] = value;
  }

  writeManifest(manifest);
  console.log(`📦 Bulk updated configModified keys in assets-manifest.json`);
}
