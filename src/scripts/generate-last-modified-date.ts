// src/scripts/generate-last-modified-dates.ts
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CONTENT_DIR = 'src/content';
const OUTPUT_FILE = 'src/data/modified-dates.json';
const extensions = ['.md', '.mdx', '.astro', '.html'];

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

const contentFiles = walkDir(CONTENT_DIR);
const modifiedMap: Record<string, string> = {};

for (const filePath of contentFiles) {
  const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  let modified: string;

  try {
    modified = execSync(`git log -1 --pretty="format:%cI" "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    const stat = fs.statSync(filePath);
    modified = stat.mtime.toISOString();
  }

  const key = relativePath.replace(path.extname(relativePath), '');
  modifiedMap[key] = modified;
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(modifiedMap, null, 2), 'utf8');
console.log(`✅ Modified dates written to ${OUTPUT_FILE}`);

