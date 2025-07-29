// src/utils/buildCssBundle.ts
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry, readManifest } from './write-manifest.ts';

export async function buildCssBundle({
  type,
  inputDir,
  outputDir,
  outputFileBase,
  publicBase,
  hashed = false,
  outputType = 'css'
}: {
  type: string;
  inputDir: string;
  outputDir: string;
  outputFileBase: string;
  publicBase: string;
  hashed?: boolean;
  outputType?: 'css' | 'ts';
}) {
  const manifest = await readManifest();

  // 🔍 Collect CSS files
  const files = await fs.readdir(inputDir);
  const cssFiles = files.filter(f => f.endsWith('.css'));
  const cssNames = cssFiles.map(f => path.basename(f, '.css'));

  if (cssFiles.length === 0) {
    console.log(`⚠️ No CSS files found in ${inputDir}. Skipping.`);
    return;
  }

  const oldNames = manifest?.css?.[type]?.names ?? [];
  const added = cssNames.filter(n => !oldNames.includes(n));
const removed: string[] = oldNames.filter((n: string) => !cssNames.includes(n));

  const lastBuild = manifest?.css?.[type]?.datetime
    ? new Date(manifest.css[type].datetime)
    : new Date(0);

  let shouldRebuild = added.length > 0 || removed.length > 0;

  // Check updated files
  for (const file of cssFiles) {
    const stat = await fs.stat(path.join(inputDir, file));
    if (stat.mtime > lastBuild) {
      shouldRebuild = true;
      break;
    }
  }

  if (!shouldRebuild) {
    console.log(`✅ ${type} is up-to-date. No rebuild needed.`);
    return;
  }

  // 🔄 Merge all CSS
  let combinedCss = '';
  for (const file of cssFiles) {
    const content = await fs.readFile(path.join(inputDir, file), 'utf8');
    combinedCss += `\n/* ${file} */\n${content}`;
  }

  // 🎯 Transform once (dedupe + minify)
  const { code } = transform({
    filename: `${type}.css`,
    code: Buffer.from(combinedCss),
    minify: true,
    targets: { chrome: 100, firefox: 100, safari: 15, edge: 100 }
  });

  const finalCss = code.toString();

  await fs.mkdir(outputDir, { recursive: true });

  // 🔑 Handle hashed vs non-hashed filenames
  let outputFileName = `${outputFileBase}.${outputType}`;
  if (hashed && outputType === 'css') {
    const hash = Math.random().toString(36).slice(2, 8);
    outputFileName = `${outputFileBase}.${hash}.css`;

    // Delete old hashed versions
    const existingFiles = await fs.readdir(outputDir);
    const regex = new RegExp(`^${outputFileBase}\\.[a-z0-9]{6}\\.css$`, 'i');
    await Promise.allSettled(existingFiles.filter(f => regex.test(f))
      .map(f => fs.unlink(path.join(outputDir, f))));
  }

  const finalOutputPath = path.join(outputDir, outputFileName);

  // ✍️ Write output
  if (outputType === 'ts') {
    const tsExport = `export const ${type}Css = ${JSON.stringify(finalCss)};\n`;
    await fs.writeFile(finalOutputPath, tsExport, 'utf8');
  } else {
    await fs.writeFile(finalOutputPath, finalCss, 'utf8');
  }

  // 📌 Update manifest
 const publicPath = path.posix.join(publicBase, outputFileName); // Always forward slashes
 await writeManifestEntry('css', type, publicPath, { names: cssNames });


  console.log(`✅ ${type} built → ${outputFileName} (${cssNames.length} files)`);
}
