// src/utils/resolveLogos.ts
import type manifestJson from "@/data/assets-manifest.json";

type VariantRec = { width: number; png?: string };
type GroupRec = { original?: string; variants?: VariantRec[] };

type Kind = "parentOrganization" | "organization" | "desktop" | "mobile" | "icon";
type Mode = "schema" | "variant" | "original";

type ResolveOpts = {
  manifest: typeof manifestJson;
  kind: Kind;
  toAbsoluteUrl: (p: string) => string;
  fallback?: string;
  minWidth?: number;   // default 112
  mode?: Mode;         // default 'schema'
};

type ResolveResult = { url?: string; width?: number; source?: "variant" | "original" | "fallback" };

// --- Helper: pick smallest PNG >= minWidth (else largest PNG)
function pickBestPngVariant(variants?: VariantRec[], minWidth = 112): VariantRec | null {
  if (!variants?.length) return null;
  const pngs = variants.filter(v => !!v.png).sort((a, b) => a.width - b.width);
  if (!pngs.length) return null;
  const atLeast = pngs.find(v => v.width >= minWidth);
  return atLeast || pngs[pngs.length - 1];
}

// --- NEW: getGroup with organization→desktop fallback
function getGroupWithFallback(manifest: typeof manifestJson, kind: Kind): GroupRec | undefined {
  const logos = (manifest as any)?.logosPublic || {};
  const org = logos.organizationLogo as GroupRec | undefined;
  if (kind === "organization") {
    // If organizationLogo missing, fall back to desktopLogo
    return org || (logos.desktopLogo as GroupRec | undefined);
  }
  if (kind === "parentOrganization") return logos.parentOrganizationLogo as GroupRec;
  if (kind === "desktop")            return logos.desktopLogo as GroupRec;
  if (kind === "mobile")             return logos.mobileLogo as GroupRec;
  if (kind === "icon")               return logos.iconLogo as GroupRec;
  return undefined;
}

export function resolveLogoFromManifest(opts: ResolveOpts): ResolveResult {
  const {
    manifest,
    kind,
    toAbsoluteUrl,
    fallback,
    minWidth = 112,
    mode = "schema",
  } = opts;

  const group = getGroupWithFallback(manifest, kind);

  const useOriginal = (): ResolveResult => {
    if (group?.original) return { url: toAbsoluteUrl(group.original), source: "original" };
    if (fallback && (/^https?:\/\//i.test(fallback) || fallback.startsWith("/"))) {
      return { url: toAbsoluteUrl(fallback), source: "fallback" };
    }
    return {};
  };

  // Always try a PNG variant first for schema/variant modes
  const useVariant = (): ResolveResult => {
    const pick = pickBestPngVariant(group?.variants, minWidth);
    if (pick?.png) return { url: toAbsoluteUrl(pick.png), width: pick.width, source: "variant" };
    return useOriginal();
  };

  switch (mode) {
    case "original": return useOriginal();
    case "variant":  return useVariant();
    case "schema":
    default:         return useVariant(); // schema prefers a single PNG ≥ 112px
  }
}
/**
 * use:
 * const { url } = resolveLogoFromManifest({
 *  manifest,
 *  kind: "organization",
 *  mode: "schema",        // get one good PNG for JSON-LD
 *  toAbsoluteUrl,
 *  minWidth: 112
 *});
 */