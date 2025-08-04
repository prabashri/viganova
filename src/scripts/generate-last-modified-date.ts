// src/scripts/generate-last-modified-dates.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_FILE = 'src/data/modified-dates.json';

// ✅ Specific standalone Astro pages
const TARGET_FILES = [
  'src/pages/index.astro',
  'src/pages/about-us.astro',
  'src/pages/privacy-policy.astro',
  'src/pages/terms.astro'
];

// ✅ Content directory
const CONTENT_DIR = 'src/content';
const extensions = ['.md', '.mdx', '.astro', '.html'];

function getLastModified(filePath: string): string {
  let modified: string;

  try {
    // Try Git commit date first
    modified = execSync(`git log -1 --pretty="format:%cI" "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch {
    // Fallback to file modified date
    const stat = fs.statSync(filePath);
    modified = stat.mtime.toISOString();
  }

  return modified;
}

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

const modifiedMap: Record<string, string> = {};

// ✅ Process selected Astro pages
for (const filePath of TARGET_FILES) {
  if (fs.existsSync(filePath)) {
    const key = path.basename(filePath, path.extname(filePath)); // e.g. "index"
    modifiedMap[key] = getLastModified(filePath);
  } else {
    console.warn(`⚠️ File not found: ${filePath}`);
  }
}

// ✅ Process all files in src/content/
const contentFiles = walkDir(CONTENT_DIR);

for (const filePath of contentFiles) {
  const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const key = relativePath.replace(path.extname(relativePath), ''); // remove extension
  modifiedMap[key] = getLastModified(filePath);
}

// ✅ Write output file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(modifiedMap, null, 2), 'utf8');
console.log(`✅ Modified dates written to ${OUTPUT_FILE}`);
