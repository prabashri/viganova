// src/types/siteDefaults.ts

/** ---------- PAGE TYPES ---------- */
export type PageFlags = {
  title: string;
  description: string;

  /** Render route content? If false, page files can redirect away. */
  enabled?: boolean;          // default: true

  /** SEO robots: index vs noindex. */
  index?: boolean;            // default: true (except 404)

  /** Include URL in sitemap? */
  sitemap?: boolean;          // default: true (except 404 & search)

  /** Navigation helpers (optional) */
  showInHeaderNav?: boolean;  // default: false
  showInFooterNav?: boolean;  // default: true for legal pages

  /** Custom path, if not the default slug (e.g., "/privacy-policy/") */
  path?: string;

  /** Path to the page content file */
  location?: string;          // e.g., "content/pages/PrivacyPolicy.astro"
};

export type StaticPageDefaults = {
  privacyPolicy: PageFlags;
  contact:       PageFlags;
  about:         PageFlags;
  terms:         PageFlags;
  search:        PageFlags;
  notFound:      PageFlags;   // 404
  refund:        PageFlags;   // use "refund" (not "refundPolicy") to match your config
};

export type PageKey = keyof StaticPageDefaults;

export const DEFAULTS: Required<
  Pick<PageFlags, 'enabled'|'index'|'sitemap'|'showInHeaderNav'|'showInFooterNav'>
> = {
  enabled: true,
  index:   true,
  sitemap: true,
  showInHeaderNav: false,
  showInFooterNav: false,
};

function isFilePath(p: string): boolean {
  return /\.[a-z0-9]{2,8}$/i.test(p);
}
function ensureLeadingSlash(p: string): string {
  return p.startsWith('/') ? p : `/${p}`;
}
function ensureTrailingSlashIfRoute(p: string): string {
  if (!p) return '/';
  if (isFilePath(p)) return p;
  return p.endsWith('/') ? p : `${p}/`;
}
function normalizeRoutePath(p: string): string {
  return ensureTrailingSlashIfRoute(ensureLeadingSlash(p));
}

export function normalizePageFlags(p: PageFlags, key?: PageKey): Required<PageFlags> {
  const defaultPath =
    key === 'privacyPolicy' ? '/privacy-policy/' :
    key === 'contact'       ? '/contact-us/'     :
    key === 'about'         ? '/about-us/'       :
    key === 'terms'         ? '/terms/'          :
    key === 'search'        ? '/search/'         :
    key === 'notFound'      ? '/404/'            :
    key === 'refund'        ? '/refund-policy/'  :
                              '/';

  const pathNormalized = normalizeRoutePath(p.path ?? defaultPath);

  const base: Required<PageFlags> = {
    title: p.title,
    description: p.description,
    enabled: p.enabled ?? DEFAULTS.enabled,
    index:   p.index   ?? DEFAULTS.index,
    sitemap: p.sitemap ?? DEFAULTS.sitemap,
    showInHeaderNav: p.showInHeaderNav ?? DEFAULTS.showInHeaderNav,
    showInFooterNav: p.showInFooterNav ?? DEFAULTS.showInFooterNav,
    path: pathNormalized,
    location: p.location ?? '',
  };

  if (key === 'notFound') {
    base.index = false;
    base.sitemap = false;
    base.showInHeaderNav = false;
    base.showInFooterNav = false;
  }
  if (key === 'search') {
    base.sitemap = false;
  }
  if (key === 'privacyPolicy' || key === 'terms' || key === 'refund') {
    base.showInFooterNav = p.showInFooterNav ?? true;
  }

  return base;
}

/** ---------- SITE-WIDE TYPES (new) ---------- */
export type ContactInfo = {
  email?: string;
  phone?: string;
  whatsapp?: string; // digits only, for wa.me links
};

export type Address = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  googleMap?: string;
};

export type SocialLinks = {
  x?: string; // handle without @
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  mastodon?: string;
  bluesky?: string;
  github?: string;
  email?: string; // mailto:...
  [k: string]: string | undefined;
};

export type AdminInfo = {
  name?: string;
  email?: string;
};

export type PersonRef = {
  type?: 'Person';
  name: string;
  email?: string;
  jobTitle?: string;
  contact?: ContactInfo;
  image?: string;
  url?: string;
  internalId?: string;
  sameAs?: string[];
};

export type OrganizationConfig = {
  type?: 'Organization' | 'Person';
  name?: string;
  url?: string;       // should end with '/'; code will normalize
  email?: string;
  logo?: string;      // public path or absolute
  sameAs?: string[];
  contact?: ContactInfo;
  address?: Address;

  incharge?: PersonRef;
  founder?: PersonRef;

  legalName?: string;
  jurisdictionCountry?: string;
  jurisdictionRegion?: string;
  foundingDate?: string;
  dissolutionDate?: string;
  taxId?: string;
  registrationId?: string;
  vatId?: string;
  dunsId?: string;
};

export type CollectionsConfig = Record<string, {
  index?: boolean;
  sitemap?: boolean;
  base?: string;
  label?: string;
  rss?: boolean;
  tags?: boolean;
  categories?: boolean;
  authors?: boolean;
  search?: boolean;
}>;

export type SiteDefaults = {
  siteName: string;
  shortName?: string;
  publishedDate?: string;

  cloudflareUrl?: string;

  domainName?: string;
  siteUrl: string;
  title: string;
  description: string;
  keywords?: string[];

  socialLinks?: SocialLinks;
  admin?: AdminInfo;
  contact?: ContactInfo;
  address?: Address;

  organization?: OrganizationConfig;

  shareLinks?: string[];
  separator?: string;

  rss?: boolean;
  sitemap?: boolean;
  cdnPath?: string;

  noOfPostsPerPage?: number;
  postsPerCollectionsPage?: number;

  fieldCollections?: Record<string, unknown>;
  collections?: CollectionsConfig;

  searchPages?: string[];
  searchIndexPath?: string;

  serviceWorkerPaths?: string[];

  pages: StaticPageDefaults; // 👈 your per-page config lives here
};
