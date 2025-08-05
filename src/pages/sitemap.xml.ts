// src/pages/sitemap.xml.ts
import { getCollection } from "astro:content";
import { siteDefaults } from "../config/siteDefaults";
import modifiedDatesJson from "../data/modified-dates.json";
import imageData from "../data/image-format-details.json";
import { getAbsoluteImageUrl } from "../utils/getAbsoluteImageUrl";

const modifiedDates: Record<string, string> = modifiedDatesJson;

function getLastModified(slug: string, base?: string): string {
  const key = base ? `${base}/${slug}` : slug;
  return modifiedDates[key] || modifiedDates[slug] || new Date().toISOString();
}

function filenameToTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/-/g, " ");
}

export async function GET() {
  try {
    const baseUrl = siteDefaults.siteUrl.replace(/\/$/, "");
    const pages: { url: string; lastmod?: string; priority?: number; image?: { loc: string; title: string } }[] = [];
    const allPosts: any[] = [];

    // ------------------------
    // 1️⃣ Static Pages
    // ------------------------
    const staticPages = [
      { url: "/", priority: 1.0 },
      { url: "/about-us/", priority: 0.8 },
      { url: "/contact-us/", priority: 0.8 },
      { url: "/privacy-policy/", priority: 0.5 },
      { url: "/terms/", priority: 0.5 },
      { url: "/404/", priority: 0.1 }
    ];

    // Add base path for each fieldCollections key (tags, categories, etc.)
    for (const key of Object.keys(siteDefaults.fieldCollections || {})) {
      staticPages.push({ url: `/${key}/`, priority: 0.6 });
    }

    // Add collection base paths like /blog/, /team/
    for (const [, config] of Object.entries(siteDefaults.collections) as [
      string,
      any
    ][]) {
      if (config?.base) {
        staticPages.push({ url: `/${config.base}/`, priority: 0.8 });
      }
    }

    staticPages.forEach((p) => {
      pages.push({ url: p.url, priority: p.priority });
    });

    // ------------------------
    // 2️⃣ Dynamic Collections (entries inside collections)
    // ------------------------
    for (const [key, config] of Object.entries(siteDefaults.collections) as [
      keyof typeof siteDefaults.collections,
      any
    ][]) {
      if (!config.index || config.sitemap === false) continue;

      const items = await getCollection(key, ({ data }) =>
        data.index !== false &&
        !(typeof data.slug === "string" && data.slug.startsWith("_")) &&
        (!("draft" in data) || !data.draft)
      );

      allPosts.push(...items);

      items.forEach((entry) => {
        const basePath = config.base ? `/${config.base}` : "";
        const urlSlug = entry.id.endsWith("/") ? entry.id : `${entry.id}/`;
        const url = `${basePath ? `${basePath}/` : "/"}${urlSlug}`;
        pages.push({
          url,
          lastmod: getLastModified(entry.id, config.base),
        });
      });
    }

    // ------------------------
    // 3️⃣ Images
    // ------------------------
    for (const [fileName, details] of Object.entries(imageData)) {
      const cleanName = fileName.replace(/\.[^.]+$/, "");
      const title = filenameToTitle(fileName);
      const largestVariant = Math.max(...details.variants.map(Number));
      const imageUrl = getAbsoluteImageUrl(
        details.path,
        `${cleanName}-w${largestVariant}-a${details.aspect}.webp`
      );

      pages.push({
        url: "/",
        image: { loc: imageUrl, title },
      });
    }

    // ------------------------
    // 4️⃣ Generate XML
    // ------------------------
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages
  .map((p) => {
    const fullUrl = `${baseUrl}${p.url}`;
    return `<url>
  <loc>${fullUrl}</loc>
  ${p.lastmod ? `<lastmod>${new Date(p.lastmod).toISOString()}</lastmod>` : ""}
  ${p.priority ? `<priority>${p.priority.toFixed(1)}</priority>` : ""}
  ${
    p.image
      ? `<image:image><image:loc>${p.image.loc}</image:loc><image:title>${p.image.title}</image:title></image:image>`
      : ""
  }
</url>`;
  })
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
