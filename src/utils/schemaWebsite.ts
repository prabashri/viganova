// src/utils/schemaWebsite.ts
import { siteDefaults } from "@/config/siteDefaults";
import { siteImages } from "@/config/siteImages";

import { getImageMeta, constructUrl } from "@/utils/getImage";
import { parseImageDims } from "@/utils/imageHelpers";

import { buildOrganizationSchema } from "@/utils/schemaOrganization";
import { toAbsoluteUrl, idFor } from "@/utils/urls";


/** Build an ImageObject from a public path or pipeline key. */
function imageObjectFromPublicOrKey(src?: string) {
  if (!src) return undefined;

  // If user passed a key like "featured/hero.png" (no leading /), try pipeline first
  const isKey = !src.startsWith("http") && !src.startsWith("/");
  if (isKey) {
    const meta = getImageMeta(src);
    if (meta) {
      const url = constructUrl(meta, "full", "png") as string;
      const abs = toAbsoluteUrl(url.startsWith("/") ? url : `/${url}`);
      const dims = parseImageDims(abs);
      return {
        "@type": "ImageObject",
        url: abs,
        ...(dims?.width ? { width: dims.width } : {}),
        ...(dims?.height ? { height: dims.height } : {})
      };
    }
  }

  // Otherwise treat as a public path or absolute URL
  const abs = toAbsoluteUrl(src);
  const dims = parseImageDims(abs);
  return {
    "@type": "ImageObject",
    url: abs,
    ...(dims?.width ? { width: dims.width } : {}),
    ...(dims?.height ? { height: dims.height } : {})
  };
}

function pickWebsitePrimaryImages() {
  const candidates = [siteImages?.featuredImage, siteImages?.image].filter(Boolean) as string[];
  const objs = candidates
    .map(imageObjectFromPublicOrKey)
    .filter(Boolean);
  return objs.length > 1 ? objs : objs[0]; // array if multiple, else single
}

export function buildWebsiteSchema() {
  const siteRoot = toAbsoluteUrl("/");
  const websiteId = idFor("website", "/");
  const { orgId } = buildOrganizationSchema();

  const name = siteDefaults.title || siteDefaults.siteName;
  const imageNodeOrArray = pickWebsitePrimaryImages();

  const sameAs = (() => {
    const s = siteDefaults.socialLinks || {};
    const out: string[] = [];
    if (s.x) out.push(`https://x.com/${String(s.x).replace(/^@/, "")}`);
    if (s.facebook) out.push(s.facebook);
    if (s.instagram) out.push(s.instagram);
    return out.length ? out : undefined;
  })();

  const websiteSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId,
    url: siteRoot,
    name,
    ...(siteDefaults.shortName ? { alternateName: siteDefaults.shortName } : {}),
    ...(imageNodeOrArray ? { image: imageNodeOrArray } : {}),
    ...(sameAs ? { sameAs } : {}),
    ...(siteDefaults?.jurisdictionCountry ? { inLanguage: "en-IN" } : {}), // adjust to your locale
    publisher: { "@id": orgId },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteRoot}search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return { node: websiteSchema, websiteId };
}
