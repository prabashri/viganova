// src/utils/schemaOrganization.ts
import { siteDefaults } from "@/config/siteDefaults";
import manifest from "@/data/assets-manifest.json";
import { resolveLogoFromManifest } from "@/utils/resolveLogos";
import { toAbsoluteUrl, idFor } from "@/utils/urls"; // for IDE hints

/** Basic URL helpers (keep consistent with Schema.astro) */
const ORIGIN = new URL(siteDefaults.siteUrl || "https://example.com");
ORIGIN.pathname = "/";

/** Basic normalization */
function normalizeEmail(e?: string) {
  if (!e) return undefined;
  return e.replace(/^mailto:/i, "").trim();
}


/** Build sameAs list from site-level socialLinks if org.sameAs is missing */
function sameAsFromSite(): string[] | undefined {
  const s = siteDefaults.socialLinks || {};
  const out: string[] = [];
  if (s.x) out.push(`https://x.com/${String(s.x).replace(/^@/, "")}`);
  if (s.facebook) out.push(s.facebook);
  if (s.instagram) out.push(s.instagram);
  if ((s as any).linkedin) out.push((s as any).linkedin as string);
  if ((s as any).youtube) out.push((s as any).youtube as string);
  if ((s as any).mastodon) out.push((s as any).mastodon as string);
  if ((s as any).bluesky) out.push((s as any).bluesky as string);
  if ((s as any).github) out.push((s as any).github as string);
  return out.length ? out : undefined;
}

/**
 * PRIMARY ORG (this website/brand)
 * Merge in site-level fallbacks (brand name, url, contact, legal bits).
 */
function getPrimaryOrgConfig() {
  const org = (siteDefaults as any).organization || {};

  const brandName =
    siteDefaults.siteName ||
    siteDefaults.shortName ||
    siteDefaults.title ||
    "Organization";

  // normalize founders: always an array internally
  const rawFounder = (siteDefaults as any).founder ?? (org as any).founder;
  const foundersArray = Array.isArray(rawFounder)
    ? rawFounder
    : rawFounder
    ? [rawFounder]
    : undefined;

  const merged = {
    type: siteDefaults.organizationType || "Organization",
    name: brandName,
    url: siteDefaults.siteUrl || "/",
    email:
      org.email ||
      siteDefaults.contact?.email ||
      siteDefaults.admin?.email ||
      siteDefaults.incharge?.email,

    logo: undefined as unknown as string,

    sameAs: sameAsFromSite(),

    contact: {
      email: siteDefaults.contact?.email || siteDefaults.incharge?.contact?.email,
      phone: siteDefaults.contact?.phone || siteDefaults.incharge?.contact?.phone,
      whatsapp:
        siteDefaults.contact?.whatsapp ||
        siteDefaults.incharge?.contact?.whatsapp,
    },
    address: {
      streetAddress: siteDefaults.address?.streetAddress,
      addressLocality: siteDefaults.address?.addressLocality,
      addressRegion: siteDefaults.address?.addressRegion,
      postalCode: siteDefaults.address?.postalCode,
      addressCountry: siteDefaults.address?.addressCountry,
    },

    legalName: siteDefaults.legalName || org.legalName,
    jurisdictionCountry: siteDefaults.jurisdictionCountry || org.jurisdictionCountry,
    jurisdictionRegion: siteDefaults.jurisdictionRegion || org.jurisdictionRegion,
    foundingDate: siteDefaults.foundingDate || org.foundingDate,
    registrationId: siteDefaults.registrationId || org.registrationId,

    // leadership
    incharge: (siteDefaults as any).incharge || org.incharge,
    founder: foundersArray, // <-- always array or undefined
  };

  (merged as any).url = toAbsoluteUrl(merged.url);
  return merged;
}

/** Parent Organization (optional) */
function getParentOrgConfig() {
  const p = (siteDefaults as any).parentOrganization;
  if (!p?.url && !p?.name) return undefined;
  const merged = {
    type: p.type || "Organization",
    name: p.name,
    url: p.url || "/",
    email: p.email,
    logo: p.logo,
    sameAs: Array.isArray(p.sameAs) && p.sameAs.length ? p.sameAs : undefined,
    contact: p.contact,
    address: p.address,
    legalName: p.legalName,
    jurisdictionCountry: p.jurisdictionCountry,
    jurisdictionRegion: p.jurisdictionRegion,
    foundingDate: p.foundingDate,
    registrationId: p.registrationId,
    incharge: p.incharge,
    founder: p.founder,
  };
  (merged as any).url = toAbsoluteUrl(merged.url);
  return merged;
}

/** Pick the best available email with fallbacks (org → org.contact → global.contact → admin → socialLinks.email) */
function pickEmail(): string | undefined {
  const org = getPrimaryOrgConfig();
  const email =
    normalizeEmail(org.email) ||
    normalizeEmail(org.contact?.email) ||
    normalizeEmail(siteDefaults.contact?.email) ||
    normalizeEmail(siteDefaults.admin?.email) ||
    normalizeEmail(siteDefaults.socialLinks?.email);
  return email;
}

/** Pick the best phone with fallbacks (org.contact → global.contact → incharge/founder) */
function pickPhone(): string | undefined {
  const org = getPrimaryOrgConfig();
  return (
    org.contact?.phone ||
    siteDefaults.contact?.phone ||
    (org.incharge as any)?.contact?.phone ||
    (org.founder as any)?.contact?.phone ||
    undefined
  );
}

/** WhatsApp if present (org.contact → global.contact) */
function pickWhatsapp(): string | undefined {
  const org = getPrimaryOrgConfig();
  return org.contact?.whatsapp || siteDefaults.contact?.whatsapp || undefined;
}

/** Organization URL / type / name */
function orgBasics() {
  const org = getPrimaryOrgConfig();
  const type = org.type || "Organization";
  const url = toAbsoluteUrl(org.url || siteDefaults.siteUrl || "/");
  const name = org.name || siteDefaults.siteName || siteDefaults.title;
  return { type, url, name };
}

/** Build a schema ImageObject from manifest (organization logo) */
function orgLogoImageObject() {
  const resolved = resolveLogoFromManifest({
    manifest,
    kind: "organization",
    mode: "schema",          // pick a single PNG >= 112px
    toAbsoluteUrl,
    // optional final fallback (site-absolute) if you really want one:
    // fallback: "/logos/desktop-logo-175w.png",
  }) as { url?: string; width?: number };

  if (resolved?.url) {
    const obj: Record<string, any> = { "@type": "ImageObject", url: resolved.url };
    if (resolved.width) obj.width = resolved.width;
    return obj;
  }
  return undefined;
}


function buildPersonNode(p?: any) {
  if (!p?.name) return undefined;

  // Stable @id for the person
  const baseId = p.internalId
    ? toAbsoluteUrl(p.internalId)
    : (p.url ? toAbsoluteUrl(p.url) : undefined);

  const node: Record<string, any> = {
    "@type": "Person",
    name: p.name,
    ...(baseId ? { "@id": baseId + "#person" } : {}),
    ...(p.url ? { url: toAbsoluteUrl(p.url) } : {}),
    ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
    ...(p.email ? { email: normalizeEmail(p.email) } : {}),
    ...(Array.isArray(p.sameAs) && p.sameAs.length
      ? { sameAs: p.sameAs }
      : {}),
  };

  return node;
}

function buildPeopleArray(maybeMany: any): any[] | undefined {
  if (!maybeMany) return undefined;
  const arr = Array.isArray(maybeMany) ? maybeMany : [maybeMany];
  const built = arr
    .map((p) => buildPersonNode(p))
    .filter(Boolean);
  return built.length ? built : undefined;
}


/** ContactPoint arrays (customer support / WhatsApp) */
function contactPoints() {
  const phone = pickPhone();
  const whatsapp = pickWhatsapp();
  const cps: any[] = [];
  if (phone) {
    cps.push({
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: phone,
      availableLanguage: ["en"],
    });
  }
  if (whatsapp) {
    cps.push({
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `https://wa.me/${whatsapp}`,
    });
  }
  return cps.length ? cps : undefined;
}

/** Build a Brand node */
function buildBrandNode() {
  const brandName = siteDefaults.shortName || siteDefaults.siteName || siteDefaults.title;
  if (!brandName) return undefined;

  const brandUrl = toAbsoluteUrl(siteDefaults.siteUrl || "/");
  const brandId = idFor("brand", brandUrl); // keep consistent base

  const logo = orgLogoImageObject();
  const sameAs = sameAsFromSite();

  const node: Record<string, any> = {
    "@type": "Brand",
    "@id": brandId,
    name: brandName,
    url: brandUrl,
    ...(logo ? { logo } : {}),
    ...(sameAs ? { sameAs } : {}),
  };
  return { brandNode: node, brandId };
}

/** Build Parent Organization node */
function buildParentOrganizationNode() {
  const cfg = getParentOrgConfig();
  if (!cfg?.url || !cfg?.name) return undefined;

  const parentOrgUrl = toAbsoluteUrl(cfg.url);
  const parentOrgId = idFor("organization", parentOrgUrl);

  const node: Record<string, any> = {
    "@type": "Organization",
    "@id": parentOrgId,
    name: cfg.name,
    url: parentOrgUrl,

    ...(cfg.legalName
      ? { legalName: cfg.legalName }
      : {}),

    // areaServed can be a country/region string. We're using jurisdictionCountry like before.
    ...(cfg.jurisdictionCountry
      ? { areaServed: cfg.jurisdictionCountry }
      : {}),

    ...(cfg.foundingDate
      ? { foundingDate: cfg.foundingDate }
      : {}),

    ...(cfg.registrationId
      ? { identifier: cfg.registrationId }
      : {}),

    ...(Array.isArray(cfg.sameAs) && cfg.sameAs.length
      ? { sameAs: cfg.sameAs }
      : {}),
  };

  // Attach parent organization logo if available
  const parentLogo = resolveLogoFromManifest({
    manifest,
    kind: "parentOrganization",
    mode: "schema",
    toAbsoluteUrl,
  }) as { url?: string; width?: number };

  if (parentLogo?.url) {
    node.logo = {
      "@type": "ImageObject",
      url: parentLogo.url,
      ...(parentLogo.width ? { width: parentLogo.width } : {}),
    };
  }

  // 🔁 Founders (can be one or many)
  // cfg.founder may now be a single object OR an array of founders.
  const parentFounders = buildPeopleArray((cfg as any).founder);
  if (parentFounders) {
    node.founder =
      parentFounders.length === 1 ? parentFounders[0] : parentFounders;
  }

  // 🔁 Incharge / key contact (optional, mirrors what we do for main org)
  const parentIncharge = buildPeopleArray((cfg as any).incharge);
  if (parentIncharge) {
    // we expose them as `employee` so Google still understands it's a Person
    node.employee =
      parentIncharge.length === 1 ? parentIncharge[0] : parentIncharge;
  }

  return {
    parentNode: node,
    parentOrgId,
  };
}


/** Build a single, canonical Organization node with proper @id references.
 *  Ensures brand and parentOrganization use @id links only (no inline types).
 */
export function buildOrganizationSchema() {
  const orgCfg = getPrimaryOrgConfig();
  const { type, url, name } = orgBasics();
  const orgId = idFor("organization", url);

  const email = pickEmail();
  const sameAs = Array.isArray(orgCfg.sameAs) && orgCfg.sameAs.length ? orgCfg.sameAs : undefined;

  const { brandNode, brandId } = buildBrandNode() || ({} as any);
  const parent = buildParentOrganizationNode();

  /** Main Organization node */
  const node: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": orgId,
    name,
    url,
    ...(email ? { email } : {}),
    ...(sameAs ? { sameAs } : {}),
    ...(orgLogoImageObject() ? { logo: orgLogoImageObject() } : {}),
    ...(orgCfg.legalName ? { legalName: orgCfg.legalName } : {}),
    ...(orgCfg.jurisdictionCountry ? { areaServed: orgCfg.jurisdictionCountry } : {}),
    ...(orgCfg.foundingDate ? { foundingDate: orgCfg.foundingDate } : {}),
    ...(orgCfg.registrationId ? { identifier: orgCfg.registrationId } : {}),
    ...(contactPoints() ? { contactPoint: contactPoints() } : {}),

    // ✅ Correct reference-only linking (Google prefers @id)
    ...(brandId ? { brand: { "@id": brandId } } : {}),
    ...(parent?.parentOrgId ? { parentOrganization: { "@id": parent.parentOrgId } } : {}),
    
  };

// Leadership / Founders
const founders = buildPeopleArray(orgCfg.founder);
if (founders) {
  // schema.org allows Organization.founder to be Person OR [Person, ...]
  node.founder = founders.length === 1 ? founders[0] : founders;
}

// Primary contact / director-ish person
const inchargeArr = buildPeopleArray(orgCfg.incharge);
if (inchargeArr) {
  // You can choose how to expose this.
  // Option A: treat as employees (array)
  node.employee = inchargeArr.length === 1 ? inchargeArr[0] : inchargeArr;

  // Option B: also expose as contactPoint[0]?.contactType = "director/CEO"
  // if you want Google to understand leadership, but that's optional.
}


  // ✅ Final export structure
  return {
    node,
    orgId,
    // include these in your @graph if needed:
    ...(brandNode ? { brandNode } : {}),
    ...(parent?.parentNode ? { parentNode: parent.parentNode, parentOrgId: parent.parentOrgId } : {}),
  };
}
