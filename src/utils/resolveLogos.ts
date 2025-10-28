import type manifestJson from "@/data/assets-manifest.json";

type VariantRec = { width: number; png?: string };
type GroupRec = { original?: string; variants?: VariantRec[] };

type Kind = "parentOrganization" | "organization" | "desktop" | "mobile" | "icon";
type Mode = "schema" | "variant" | "original";

type ResolveOpts = {
  manifest: typeof manifestJson;
  kind: Kind;
  // optional now!
  toAbsoluteUrl?: (p: string) => string;
  fallback?: string;
  minWidth?: number;   // default 112
  mode?: Mode;         // default 'schema'
};

type ResolveResult = {
  url?: string;
  width?: number;
  source?: "variant" | "original" | "fallback";
};

// pickBestPngVariant: (unchanged)
function pickBestPngVariant(
  variants?: VariantRec[],
  minWidth = 112
): VariantRec | null {
  if (!variants?.length) return null;
  const pngs = variants.filter(v => !!v.png).sort((a, b) => a.width - b.width);
  if (!pngs.length) return null;
  const atLeast = pngs.find(v => v.width >= minWidth);
  return atLeast || pngs[pngs.length - 1];
}

function getGroupWithFallback(
  manifest: typeof manifestJson,
  kind: Kind
): GroupRec | undefined {
  const logos = (manifest as any)?.logosPublic || {};
  const org = logos.organizationLogo as GroupRec | undefined;
  if (kind === "organization") {
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

  // helper: ensureAbs()
  // if a toAbsoluteUrl was provided, run it; else just return p as-is.
  const ensureAbs = (p: string) => (toAbsoluteUrl ? toAbsoluteUrl(p) : p);

  const group = getGroupWithFallback(manifest, kind);

  const useOriginal = (): ResolveResult => {
    if (group?.original) {
      return { url: ensureAbs(group.original), source: "original" };
    }
    if (
      fallback &&
      (/^https?:\/\//i.test(fallback) || fallback.startsWith("/"))
    ) {
      return { url: ensureAbs(fallback), source: "fallback" };
    }
    return {};
  };

  const useVariant = (): ResolveResult => {
    const pick = pickBestPngVariant(group?.variants, minWidth);
    if (pick?.png) {
      return {
        url: ensureAbs(pick.png),
        width: pick.width,
        source: "variant",
      };
    }
    return useOriginal();
  };

  switch (mode) {
    case "original":
      return useOriginal();
    case "variant":
      return useVariant();
    case "schema":
    default:
      // schema prefers one PNG ≥ minWidth, so variant first
      return useVariant();
  }
}
