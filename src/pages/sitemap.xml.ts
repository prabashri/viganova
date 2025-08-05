// src/pages/sitemap.xml.ts
import { getCollection } from 'astro:content';

export async function GET() {
  const baseUrl = "https://astroweb-template-ssr.pages.dev"; // adjust if needed

  const staticPages = [
    { url: "/", priority: 1.0 },
    { url: "/about-us/", priority: 0.8 },
    { url: "/contact-us/", priority: 0.8 },
    { url: "/privacy-policy/", priority: 0.5 },
    { url: "/terms/", priority: 0.5 },
    { url: "/404/", priority: 0.1 }
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(page => `<url>
  <loc>${baseUrl}${page.url}</loc>
  <priority>${page.priority.toFixed(1)}</priority>
</url>`)
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
