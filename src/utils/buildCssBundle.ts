// src/utils/buildCssBundle.ts
import fs from 'fs/promises';
import path from 'path';
import { transform } from 'lightningcss';
import { writeManifestEntry, readManifest } from './write-manifest.ts';

function getErrorSnippet(content: string, errorLine: number, context = 5) {
  const lines = content.split('\n');
  const start = Math.max(errorLine - context, 0);
  const end = Math.min(errorLine + context, lines.length);
  return lines
    .slice(start, end)
    .map((l, i) => `${start + i + 1}: ${l}`)
    .join('\n');
}

export async function buildCssBundle({
  type,
  inputDir,
  outputDir,
  outputFileBase,
  publicBase,
  hashed = false,
  outputType = 'css'
}:{
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
    await writeManifestEntry('css', type, '', { names: cssNames });
    console.log(`⚠️ Updated the assets-manifest.json with no CSS files found in ${inputDir}.`);
    return;
  }

  const oldNames = manifest?.css?.[type]?.names ?? [];
  const added = cssNames.filter(n => !oldNames.includes(n));
  const removed = oldNames.filter((n: string) => !cssNames.includes(n));

  const lastBuild = manifest?.css?.[type]?.datetime
    ? new Date(manifest.css[type].datetime)
    : new Date(0);

  let shouldRebuild = added.length > 0 || removed.length > 0;

  // Check updated files individually
  for (const file of cssFiles) {
    const filePath = path.join(inputDir, file);
    const stat = await fs.stat(filePath);
    if (stat.mtime > lastBuild) shouldRebuild = true;

    // Validate each CSS file
    const content = await fs.readFile(filePath, 'utf8');
    try {
      transform({
        filename: file,
        code: Buffer.from(content),
        minify: false
      });
    } catch (err: any) {
      console.error(`❌ CSS Parse Error in ${filePath}`);
      console.error(`Line ${err?.loc?.line}, Column ${err?.loc?.column}`);
      console.error(getErrorSnippet(content, err?.loc?.line ?? 1, 5));
      throw err;
    }
  }

  if (!shouldRebuild) {
    console.log(`✅ ${type} is up-to-date. No rebuild needed.`);
    return;
  }

  // 🔄 Merge CSS
  let combinedCss = '';
  for (const file of cssFiles) {
    const content = await fs.readFile(path.join(inputDir, file), 'utf8');
    combinedCss += `\n/* ${file} */\n${content}`;
  }

  // 🎯 Transform merged CSS
  const { code } = transform({
    filename: `${type}.css`,
    code: Buffer.from(combinedCss),
    minify: true
  });

  const finalCss = code.toString();
  await fs.mkdir(outputDir, { recursive: true });

  let outputFileName = `${outputFileBase}.${outputType}`;
  if (hashed && outputType === 'css') {
    const hash = Math.random().toString(36).slice(2, 8);
    outputFileName = `${outputFileBase}.${hash}.css`;

    const existingFiles = await fs.readdir(outputDir);
    const regex = new RegExp(`^${outputFileBase}\\.[a-z0-9]{6}\\.css$`, 'i');
    await Promise.allSettled(existingFiles.filter(f => regex.test(f))
      .map(f => fs.unlink(path.join(outputDir, f))));
  }

  const finalOutputPath = path.join(outputDir, outputFileName);

  if (outputType === 'ts') {
    const tsExport = `export const ${type}Css = ${JSON.stringify(finalCss)};\n`;
    await fs.writeFile(finalOutputPath, tsExport, 'utf8');
  } else {
    await fs.writeFile(finalOutputPath, finalCss, 'utf8');
  }

  const publicPath = path.posix.join(publicBase, outputFileName);
  await writeManifestEntry('css', type, publicPath, { names: cssNames });

  console.log(`✅ ${type} built → ${outputFileName} (${cssNames.length} files)`);
}

