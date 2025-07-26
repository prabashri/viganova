// src/scripts/generate-email-hash.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import matter from 'gray-matter';

const TEAM_DIR = 'src/content/team';
const OUTPUT_FILE = 'src/data/email-hash.json';
const extensions = ['.md', '.mdx'];

interface EmailHashEntry {
  email: string;
  sha256: string;
}

type EmailHashMap = Record<string, EmailHashEntry>;

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (extensions.includes(path.extname(file))) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

// 1. Load existing hash map
let emailHashes: EmailHashMap = {};
if (fs.existsSync(OUTPUT_FILE)) {
  try {
    const raw = fs.readFileSync(OUTPUT_FILE, 'utf8');
    emailHashes = JSON.parse(raw);
  } catch (err: any) {
    console.warn(`⚠️  Failed to parse ${OUTPUT_FILE}: ${err.message}`);
  }
}

const teamFiles = walkDir(TEAM_DIR);
if (teamFiles.length === 0) {
  console.warn(`⚠️  No team files found in ${TEAM_DIR}`);
}

let updated = 0;

for (const filePath of teamFiles) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(raw);
    const slug: string =
      data.slug || path.basename(filePath, path.extname(filePath));

    if (!data.useGravatar) continue;

    const email: string | undefined = data.gravatarEmail || data.email;
    if (!email) {
      console.warn(`⚠️  No gravatarEmail or email found for ${slug}`);
      continue;
    }

    const sha256 = hashEmail(email);

    if (
      !emailHashes[slug] ||
      emailHashes[slug].sha256 !== sha256 ||
      emailHashes[slug].email !== email
    ) {
      emailHashes[slug] = { email, sha256 };
      updated++;
    }
  } catch (err: any) {
    console.warn(`⚠️  Failed to process ${filePath}: ${err.message}`);
  }
}

if (updated > 0) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(emailHashes, null, 2));
  console.log(`✅ ${updated} email hash${updated > 1 ? 'es' : ''} updated in ${OUTPUT_FILE}`);
} else {
  console.log(`ℹ️  No updates needed. Hashes are current.`);
}
