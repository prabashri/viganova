// src/scripts/generate-email-hash.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

const TEAM_DIR = 'src/content/team';
const OUTPUT_FILE = 'src/data/email-hash.json';
const extensions = ['.md', '.mdx'];

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (extensions.includes(path.extname(file))) {
      fileList.push(fullPath);
    }
  });

  return fileList;
}
// @ref https://docs.gravatar.com/sdk/images/ to create gravatar image URL
// @ref https://www.gravatar.com/site/implement/hash/
function hashEmail(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

// 1. Load existing hash map
let emailHashes = {};
if (fs.existsSync(OUTPUT_FILE)) {
  try {
    const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    emailHashes = JSON.parse(rawData);
  } catch (err) {
    console.warn(`⚠️  Failed to read existing hash file: ${err.message}`);
  }
}

const teamFiles = walkDir(TEAM_DIR);
if (teamFiles.length === 0) {
  console.warn(`⚠️  No team files found in ${TEAM_DIR}`);
}

let updatedCount = 0;

for (const filePath of teamFiles) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);
    const slug = data.slug || path.basename(filePath, path.extname(filePath));

    if (!data.useGravatar) {
      continue;
    }

    if (!data.email) {
      console.warn(`⚠️  Missing email for: ${slug}`);
      continue;
    }

    const emailHash = hashEmail(data.email);

    if (emailHashes[slug] !== emailHash) {
      emailHashes[slug] = emailHash;
      updatedCount++;
    }
  } catch (err) {
    console.warn(`⚠️  Failed to process: ${filePath}\n   ↳ ${err.message}`);
  }
}

if (updatedCount > 0) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(emailHashes, null, 2));
  console.log(`✅ ${updatedCount} hash${updatedCount > 1 ? 'es' : ''} updated in ${OUTPUT_FILE}`);
} else {
  console.log(`ℹ️  No changes. Existing email hashes are up to date.`);
}
