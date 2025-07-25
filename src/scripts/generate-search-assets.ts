import fs from 'fs/promises';
import path from 'path';
import https from 'https';

const VERSION = '7.1.0';
const CDN_URL = `https://cdn.jsdelivr.net/npm/fuse.js@${VERSION}/dist/fuse.min.js`;
const DEST_PATH = path.resolve('public/vendor/fuse.min.js');

async function downloadFuseIfMissing() {
  try {
    // Check if file exists
    const existing = await fs.readFile(DEST_PATH, 'utf-8');

    // ✅ Check if version comment is present (we'll tag it)
    if (existing.includes(`Fuse.js v${VERSION}`)) {
      console.log(`✅ Fuse.js v${VERSION} already exists. Skipping download.`);
      return;
    }

    console.log('⚠️ Existing Fuse.js found, but version mismatch. Updating...');
  } catch {
    console.log('📁 Fuse.js not found. Downloading...');
  }

  const file = await fetchFile(CDN_URL);
  const versionComment = `// Fuse.js v${VERSION} - downloaded via prepare-client-assets.ts\n`;
  await fs.mkdir(path.dirname(DEST_PATH), { recursive: true });
  await fs.writeFile(DEST_PATH, versionComment + file.toString('utf-8'));

  console.log(`✅ Fuse.js v${VERSION} saved to /public/vendor/fuse.min.js`);
}

function fetchFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
        return;
      }

      const chunks: Uint8Array[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

downloadFuseIfMissing().catch((err) => {
  console.error(`❌ Failed to prepare Fuse.js: ${err.message}`);
  process.exit(1);
});
