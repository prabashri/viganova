// src/scripts/generate-sitemap-from-json.ts
import fs from "fs";
import path from "path";
import modifiedDatesJson from "../data/modified-dates.json";
import { siteDefaults } from "../config/siteDefaults";

const modifiedDates: Record<string, string> = modifiedDatesJson;
const baseUrl = siteDefaults.siteUrl.replace(/\/$/, "");

function keyToUrl(key: string): string {
  // Skip private keys
  if (key.startsWith("_")) return "";

  // Convert index → /
  if (key === "index") return "/";

  // Add trailing slash
  return `/${key.replace(/\/$/, "")}/`;
}

(async function buildSitemap() {
  const entries: string[] = [];

  for (const [key, date] of Object.entries(modifiedDates)) {
    const urlPath = keyToUrl(key);
    if (!urlPath) continue; // skip hidden

    entries.push(`<url>
  <loc>${baseUrl}${urlPath}</loc>
  <lastmod>${new Date(date).toISOString()}</lastmod>
</url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  const outPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf8");
  console.log(`✅ Sitemap generated from modified-dates.json → ${outPath}`);
})();
