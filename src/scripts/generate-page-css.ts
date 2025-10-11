// src/scripts/generate-page-css.ts
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { transform } from "lightningcss";
import { writeManifestEntry, readManifest } from "@/utils/write-manifest.ts";

/** ──────────────────────────────────────────────────────────────────────────
 *  generate-page-css.ts
 *  - Scans src/styles/pages/*.css
 *  - Minifies & writes hashed public assets: /public/styles/<name>.<hash>.css
 *  - Generates per-page inline TS modules: src/data/page-css/<name>.ts
 *  - Updates assets-manifest.json:
 *      css["pages"]                 → index { names, dir }
 *      css["pages:<name>"]          → { file, name, hash, mtimeMs, bytes, source, inlineModule }
 *  ────────────────────────────────────────────────────────────────────────── */

type CssEntry = {
  file?: string;
  name?: string;
  hash?: string;
  mtimeMs?: number;
  bytes?: number;
  source?: string;
  removed?: boolean;
  datetime?: string;
  inlineModule?: string;            // NEW: module path of per-page TS export
};

const INPUT_DIR       = path.resolve("src/styles/pages");
const OUTPUT_DIR      = path.resolve("public/styles");
const INLINE_OUT_DIR  = path.resolve("src/data/page-css"); // NEW: per-page inline modules
const PUBLIC_BASE     = "/styles/"; // public href prefix (manifest-facing)

function contentHash(code: Buffer | string, len = 6): string {
  const h = crypto.createHash("md5").update(code).digest("hex");
  return h.slice(0, len);
}
async function getMTimeMs(p: string) {
  const s = await fs.stat(p);
  return Math.floor(s.mtimeMs);
}
async function fileExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}
function posixJoin(...parts: string[]) { return path.posix.join(...parts); }
function hashedName(base: string, hash: string) { return `${base}.${hash}.css`; }
function hashedSiblingRegex(base: string) { return new RegExp(`^${base}\\.[a-f0-9]{6,8}\\.css$`, "i"); }
function prettyList(list: string[]) { return list.length ? list.join(", ") : "(none)"; }

/** Emit per-page inline TS module with default export string */
async function writeInlineModule(name: string, css: string) {
  await fs.mkdir(INLINE_OUT_DIR, { recursive: true });
  const outFile = path.join(INLINE_OUT_DIR, `${name}.ts`);
  const ts = `// AUTO-GENERATED: inline CSS for page "${name}"\nconst css = ${JSON.stringify(css)};\nexport default css;\n`;
  await fs.writeFile(outFile, ts, "utf8");
  // Return module path as importable alias (Astro src-relative)
  const rel = `/src/data/page-css/${name}.ts`;
  return rel;
}

async function buildEachCss() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = await readManifest();

  // 1) discover .css files
  const files = await fs.readdir(INPUT_DIR);
  const cssFiles = files.filter((f) => f.endsWith(".css"));
  const names = cssFiles.map((f) => path.basename(f, ".css"));

  await writeManifestEntry("css", "pages", PUBLIC_BASE, { names, dir: PUBLIC_BASE });

  if (cssFiles.length === 0) {
    console.log(`⚠️ No CSS files found in ${INPUT_DIR}. Index updated.`);
    return;
  }

  // 2) mark removed
  const cssSection = (manifest.css ?? {}) as Record<string, CssEntry>;
  const prevPageEntries = Object.entries(cssSection).filter(([k]) => k.startsWith("pages:"));
  const prevNames = prevPageEntries.map(([k, v]) => v?.name ?? k.replace(/^pages:/, ""));
  const removed = prevNames.filter((n) => !names.includes(n));

  if (removed.length) {
    console.log(`🧹 Removed page CSS: ${prettyList(removed)}`);
    for (const base of removed) {
      const existing = await fs.readdir(OUTPUT_DIR);
      const rx = hashedSiblingRegex(base);
      await Promise.allSettled(
        existing.filter(f => rx.test(f)).map(f => fs.unlink(path.join(OUTPUT_DIR, f)))
      );
      await writeManifestEntry("css", `pages:${base}`, "", { name: base, removed: true });
      // Also remove inline module if exists
      const inlineFile = path.join(INLINE_OUT_DIR, `${base}.ts`);
      try { await fs.unlink(inlineFile); } catch {}
    }
  }

  // 3) process each page css
  for (const file of cssFiles) {
    const base = path.basename(file, ".css");
    const srcPath = path.join(INPUT_DIR, file);
    const raw = await fs.readFile(srcPath, "utf8");

    // Validate
    try {
      transform({ filename: file, code: Buffer.from(raw), minify: false });
    } catch (err: any) {
      const lines = raw.split("\n");
      const line = err?.loc?.line ?? 1;
      const col  = err?.loc?.column ?? 0;
      const start = Math.max(line - 5, 0);
      const end = Math.min(line + 5, lines.length);
      const snippet = lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join("\n");
      console.error(`❌ CSS Parse Error in ${srcPath}`);
      console.error(`Line ${line}, Column ${col}`);
      console.error(snippet);
      throw err;
    }

    // Minify
    const { code } = transform({ filename: file, code: Buffer.from(raw), minify: true });
    const buf = Buffer.from(code);
    const hash = contentHash(buf, 6);
    const outName = hashedName(base, hash);
    const outPath = path.join(OUTPUT_DIR, outName);
    const publicPath = posixJoin(PUBLIC_BASE, outName);
    const mtimeMs = await getMTimeMs(srcPath);

    // Compare to manifest
    const key = `pages:${base}`;
    const prev: CssEntry | undefined = (manifest.css?.[key] as CssEntry | undefined);
    const alreadyUpToDate =
      prev?.hash === hash &&
      prev?.file === publicPath &&
      (await fileExists(outPath));

    if (alreadyUpToDate) {
      await writeManifestEntry("css", "pages", PUBLIC_BASE, { names, dir: PUBLIC_BASE });
      console.log(`⏭  ${file} unchanged (hash ${hash})`);
      continue;
    }

    // Clean old siblings
    const existing = await fs.readdir(OUTPUT_DIR);
    const rx = hashedSiblingRegex(base);
    await Promise.allSettled(
      existing.filter(f => rx.test(f) && f !== outName).map(f => fs.unlink(path.join(OUTPUT_DIR, f)))
    );

    // Write new hashed asset
    await fs.writeFile(outPath, buf);

    // NEW: write inline module for this page
    const inlineModule = await writeInlineModule(base, buf.toString("utf8"));

    // Update manifest
    await writeManifestEntry("css", key, publicPath, {
      name: base,
      hash,
      mtimeMs,
      bytes: buf.byteLength,
      source: path.relative(process.cwd(), srcPath),
      inlineModule, // << record the module path
    });

    console.log(`✅ ${file} → ${outName} (hash ${hash}) & inline module`);
  }

  console.log(`📦 Page CSS build complete → ${OUTPUT_DIR} & ${INLINE_OUT_DIR}`);
}

await buildEachCss();
