// src/scripts/generate-page-css.ts
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { transform } from "lightningcss";
import { writeManifestEntry, readManifest } from "@/utils/write-manifest.ts";

type CssEntry = {
  file?: string;
  name?: string;
  hash?: string;
  mtimeMs?: number;
  bytes?: number;
  source?: string;
  removed?: boolean;
  datetime?: string;
};

const INPUT_DIR  = path.resolve("src/styles/pages");
const OUTPUT_DIR = path.resolve("public/styles");
const PUBLIC_BASE = "/styles/"; // public href prefix (manifest-facing)

/** Compute a stable, URL-safe short hash from content (6 hex chars). */
function contentHash(code: Buffer | string, len = 6): string {
  const h = crypto.createHash("md5").update(code).digest("hex");
  return h.slice(0, len);
}

async function getMTimeMs(p: string): Promise<number> {
  const s = await fs.stat(p);
  return Math.floor(s.mtimeMs);
}

async function fileExists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

function posixJoin(...parts: string[]) {
  return path.posix.join(...parts);
}

function hashedName(base: string, hash: string) {
  return `${base}.${hash}.css`;
}

function hashedSiblingRegex(base: string) {
  return new RegExp(`^${base}\\.[a-f0-9]{6,8}\\.css$`, "i");
}

function prettyList(list: string[]) {
  return list.length ? list.join(", ") : "(none)";
}

async function buildEachCss() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = await readManifest();

  // 1) discover .css files
  const files = await fs.readdir(INPUT_DIR);
  const cssFiles = files.filter((f) => f.endsWith(".css"));
  const names = cssFiles.map((f) => path.basename(f, ".css"));

  // Write/refresh the index entry (so UIs can see what's available)
  await writeManifestEntry("css", "pages", PUBLIC_BASE, {
    names,
    dir: PUBLIC_BASE,
  });

  if (cssFiles.length === 0) {
    console.log(`⚠️ No CSS files found in ${INPUT_DIR}. Index updated.`);
    return;
  }

  // 2) handle removed pages (present in manifest but not on disk)
  const cssSection = (manifest.css ?? {}) as Record<string, CssEntry>;
  const prevPageEntries = Object.entries(cssSection)
    .filter(([k]) => k.startsWith("pages:"));

  const prevNames = prevPageEntries.map(([k, v]) => v?.name ?? k.replace(/^pages:/, ""));
  const removed = prevNames.filter((n) => !names.includes(n));

  if (removed.length) {
    console.log(`🧹 Removed page CSS: ${prettyList(removed)}`);
    for (const base of removed) {
      // Delete old hashed siblings from /public/styles/
      const existing = await fs.readdir(OUTPUT_DIR);
      const rx = hashedSiblingRegex(base);
      await Promise.allSettled(
        existing.filter(f => rx.test(f)).map(f => fs.unlink(path.join(OUTPUT_DIR, f)))
      );

      // Mark manifest entry as removed
      await writeManifestEntry("css", `pages:${base}`, "", {
        name: base,
        removed: true,
      });
    }
  }

  // 3) process each .css (validate → minify → hash → write if needed)
  for (const file of cssFiles) {
    const base = path.basename(file, ".css");
    const srcPath = path.join(INPUT_DIR, file);
    const raw = await fs.readFile(srcPath, "utf8");

    // Parse/validate (non-minified) for clearer errors
    try {
      transform({
        filename: file,
        code: Buffer.from(raw),
        minify: false,
      });
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

    // Minify, then hash by content (stable)
    const { code } = transform({
      filename: file,
      code: Buffer.from(raw),
      minify: true,
    });

    const buf = Buffer.from(code);
    const hash = contentHash(buf, 6); // e.g., 'el873d'
    const outName = hashedName(base, hash);
    const outPath = path.join(OUTPUT_DIR, outName);
    const publicPath = posixJoin(PUBLIC_BASE, outName);
    const mtimeMs = await getMTimeMs(srcPath);

    // Compare with manifest
    const key = `pages:${base}`;
    const prev: CssEntry | undefined = (manifest.css?.[key] as CssEntry | undefined);
    const prevHash = prev?.hash;
    const prevFile = prev?.file;

    const alreadyUpToDate =
      prevHash === hash &&
      prevFile === publicPath &&
      (await fileExists(outPath));

    if (alreadyUpToDate) {
      // No change → skip
      // Keep index fresh in case names array changed earlier
      await writeManifestEntry("css", "pages", PUBLIC_BASE, { names, dir: PUBLIC_BASE });
      console.log(`⏭  ${file} unchanged (hash ${hash})`);
      continue;
    }

    // Content changed or first build → clean old siblings for this base
    const existing = await fs.readdir(OUTPUT_DIR);
    const rx = hashedSiblingRegex(base);
    await Promise.allSettled(
      existing.filter(f => rx.test(f) && f !== outName).map(f => fs.unlink(path.join(OUTPUT_DIR, f)))
    );

    // Write new hashed artifact
    await fs.writeFile(outPath, buf);

    // Update manifest for this file
    await writeManifestEntry("css", key, publicPath, {
      name: base,
      hash,
      mtimeMs,
      bytes: buf.byteLength,
      source: path.relative(process.cwd(), srcPath),
    });

    console.log(`✅ ${file} → ${outName} (hash ${hash})`);
  }

  console.log(`📦 Page CSS build complete → ${OUTPUT_DIR}`);
}

await buildEachCss();
