// src/config/siteDefaults.ts
import type { StaticPageDefaults, PageFlags, PageKey } from '@/types/siteDefaults';
import { normalizePageFlags } from '@/types/siteDefaults';

const SITE_NAME = "EasyApostille";

export const siteDefaults = {
  siteName: SITE_NAME,
  shortName: "EasyApostille",
  publishedDate: "September 12 2025",

  cloudflareUrl: "https://easyapostille.pages.dev",

  domainName: "easyapostille.in",
  siteUrl: "https://easyapostille.in/", // ensure trailing slash

  title: `EasyApostille - Fast & Secure Certificate, Document Attestation in India`,
  description:
    "Get your MEA apostille certificates, documents attestation at EasyApostille with fast, secure, discounts & free premium delivery services across India",
  keywords: [
    "Apostille Services India",
    "MEA Approved Apostille",
    "Degree Certificate Apostille",
    "Document Authentication",
    "Apostille for Visa",
    "Study Abroad Apostille",
    "PCC Apostille",
    "Marriage Certificate Apostille",
    "Business Document Apostille",
  ],

  socialLinks: {
    x: "easyapostille", // handle WITHOUT @
    // github: "https://github.com/easyapostille",
    // linkedin: "https://linkedin.com/company/easyapostille",
    facebook: "https://facebook.com/easyapostille",
    instagram: "https://instagram.com/easyapostille",
    // youtube: "https://youtube.com/@easyapostille",
    // mastodon: "https://mastodon.social/@easyapostille",
    // bluesky: "https://bsky.app/profile/easyapostille",
    email: "mailto:admin@easyapostille.in",
  },

  // Admin contact (for technical/meta info)
  admin: {
    name: "NViews Web",
    email: "admin@nviewsweb.com",
  },

  contact: {
    email: "contact@easyapostille.in",
    phone: "+919047433266",
    whatsapp: "919047433266",
    phone2: "+919789629727",
    whatsapp2: "919789629727",
  },
  address: {
    streetAddress: "Shop No. 912, Johnson Complex, Rajaji Nagar",
    addressLocality: "Thanjavur",
    addressRegion: "Tamil Nadu",
    postalCode: "613004",
    addressCountry: "India",
    addressCountryCode: "IN", // ISO 3166-1 alpha-2 https://wikipedia.org/wiki/ISO_3166-1
    googleMap: "https://maps.app.goo.gl/YFQ5zVLgmkHaGK5x7",
  },
  // incharge of the organization (main contact person)
  incharge: {
    // for person, no need to fill this
    type: "Person",
    name: "Prabakaran Shankar",
    email: "praba@thenviews.com",
    jobTitle: "Founder & CEO",
    contact: {
      email: "praba@thenviews.com",
      phone: "+919789629727",
      whatsapp: "919789629727",
    },
    image: "",
    url: "https://prabakaranshankar.com",
    internalId: "team/prabakaran-shankar/",
    // only if dont have internalId
    sameAs: [
      "https://linkedin.com/in/prabakaranshankar",
      "https://x.com/@madanpraba",
    ],
  },
  // https://schema.org/Organization
  // https://schema.org/Person
  organizationType: "Organization", // Person | Airline | Consortium | Cooperative | Corporation | EducationalOrganization | FundingScheme | GovernmentOrganization | LibrarySystem | LocalBusiness | MedicalOrganization | NGO | NewsMediaOrganization | OnlineBusiness | PerformingGroup | PoliticalParty | Project | ResearchOrganization | SearchRescueOrganization | SportsOrganization | WorkersUnion

  jurisdictionCountry: "IN",
  jurisdictionRegion: "TN-Thanjavur", // free text OK
  foundingDate: "2025-09-01",
  // dissolutionDate: '',
  legalName: "",
  taxId: "",
  registrationId: "",
  founder: {
    type: "Person",
    name: "Prabakaran Shankar",
    email: "praba@thenviews.com",
    jobTitle: "Founder & CEO",
    contact: {
      email: "praba@thenviews.com",
      phone: "+919789629727",
      whatsapp: "919789629727",
    },
    image: "",
    url: "https://prabakaranshankar.com",
    internalId: "team/prabakaran-shankar/",
    sameAs: [
      "https://linkedin.com/in/prabakaranshankar",
      "https://x.com/@madanpraba",
    ],
  },

  // Organization block (main entity). If this is removed or partial,
  // schemaOrganization.ts will fill from site-level fields.
  parentOrganization: {
    // Set entity type dynamically: 'Organization' or 'Person'
    type: "Organization", // Change to 'Person' if site is personal brand

    // Common fields (both Organization & Person use name, url, logo, sameAs)
    name: "NViews Media Private Limited", // or 'Prabakaran Shankar' if type = 'Person'
    url: "https://thenviews.com/", // ensure trailing slash
    email: "admin@thenviews.com",
    // put it in src/assets/images/logos/ 
    logo: "src/assets/images/logos/nviews-logo.png",
    sameAs: [
      "https://linkedin.com/company/thenviews/",
      "https://prabakaranshankar.com",
    ],
    contact: {
      email: "contact@thenviews.com",
      phone: "+919789629727",
      whatsapp: "919789629727",
    },
    address: {
      streetAddress: "Shop No. 912, Johnson Complex, Rajaji Nagar",
      addressLocality: "Thanjavur",
      addressRegion: "Tamil Nadu",
      postalCode: "613004",
      addressCountry: "India",
      addressCountryCode: "IN", // ISO 3166-1 alpha-2 https://wikipedia.org/wiki/ISO_3166-1
      googleMap: "https://maps.app.goo.gl/YFQ5zVLgmkHaGK5x7",
    },    

    jurisdictionCountry: "IN",
    jurisdictionRegion: "TN-Thanjavur", // free text OK
    foundingDate: "2020-01-01",
    // dissolutionDate: '',
    legalName: "NViews Media Private Limited",
    taxId: "",
    registrationId: "U74999TN2020PTC135205",
    vatId: "",
    dunsId: "",

    founder: {
      type: "Person",
      name: "Prabakaran Shankar",
      email: "praba@thenviews.com",
      jobTitle: "Founder & CEO",
      contact: {
        email: "praba@thenviews.com",
        phone: "+919789629727",
        whatsapp: "919789629727",
      },
      image: "",
      url: "https://prabakaranshankar.com",
      internalId: "team/prabakaran-shankar/",
      sameAs: [
        "https://linkedin.com/in/prabakaranshankar",
        "https://x.com/@madanpraba",
      ],
    },
  },

  shareLinks: ["Whatsapp", "X", "Facebook", "LinkedIn", "Reddit", "Copy Link", "Email"],

  separator: "|",

  rss: true,
  sitemap: true,
  cdnPath: "",
  noOfPostsPerPage: 3,

  postsPerCollectionsPage: 2,

  fieldCollections: {
    tags: {
      label: "Tags",
      title: "Tags Collection",
      description: "Tags are used to categorize content across the site.",
      meta: "tagMeta",
      defaultImage: "tags/astroweb.png",
      maxPerEntry: 5,
      sitemapMinPosts: 5,
    },
    categories: {
      label: "Categories",
      title: "Categories Collection",
      description: "Categories are used to group related content.",
      meta: "categoryMeta",
      defaultImage: "tags/astroweb.png",
      maxPerEntry: 3,
      sitemapMinPosts: 5,
    },
  },

  collections: {
    blog: {
      index: true,
      sitemap: true,
      base: "blog",
      label: "Blog",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    service: {
      index: true,
      sitemap: true,
      base: "services",
      label: "Services",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    resource: {
      index: true,
      sitemap: true,
      base: "resources",
      label: "Resources",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    post: {
      index: true,
      sitemap: true,
      base: "",
      label: "Post",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    videos: {
      index: true,
      sitemap: true,
      base: "videos",
      label: "Videos",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    audio: {
      index: true,
      sitemap: true,
      base: "audio",
      label: "Audio",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
    },
    review:{
      index: false,
      sitemap: false,
      base: "reviews",
      label: "Reviews",
      rss: false,
      tags: false,
      categories: false,
      authors: false,
      search: false,
    },
    team: {
      index: true,
      sitemap: true,
      base: "team",
      label: "Team",
      rss: false,
      tags: false,
      categories: false,
      search: false,
    },
  },

  searchPages: ["home"],
  searchIndexPath: "/search-index.json",

  serviceWorkerPaths: [
    // '/fonts/Inter-Regular-Subset.woff2',
    // '/fonts/Inter-Bold-Subset.woff2',
  ],

  pages: {
    privacyPolicy: {
      title: `Privacy Policy — How ${SITE_NAME} Collects, Uses & Protects Your Data`,
      description: `Learn how ${SITE_NAME} collects, uses, and safeguards your information. We explain cookies, analytics, limited retention, and your choices in clear, human-readable language.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/privacy-policy/",
      location: "content/pages/PrivacyPolicy.astro",
    },
    contact: {
      title: `Contact ${SITE_NAME} — Quotes, Support, and Fast Apostille Help`,
      description: `Reach ${SITE_NAME} for fast answers, quotes, or support. Message us for document checks, timelines, and pricing—our team replies quickly and guides you through every step of the process.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInHeaderNav: true,
      showInFooterNav: true,
      path: "/contact-us/",
      location: "content/pages/Contact.astro",
    },
    about: {
      title: `About ${SITE_NAME} — Who We Are, Our Mission, and How We Help`,
      description: `Discover ${SITE_NAME}'s story, values, team and expertise in delivering secure, reliable apostille and attestation services you can trust.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/about-us/",
      location: "content/pages/About.astro",
    },
    terms: {
      title: `Terms & Conditions — Legal Terms for Using ${SITE_NAME} Services`,
      description: `Read the terms and acceptable use for ${SITE_NAME}. This page covers service rules, limitations, disclaimers, payments, and your rights when using our website and document services.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/terms/",
      location: "content/pages/Terms.astro",
    },
    refund: {
      title: `Refund Policy — Terms for Refunds and Cancellations at ${SITE_NAME}`,
      description: `Understand the refund and cancellation terms for services at ${SITE_NAME}. This page outlines your rights, the process for requesting refunds, and any applicable fees.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/refund-policy/",
      location: "content/pages/Refund.astro",
    },
    search: {
      title: `Search ${SITE_NAME} — Find Guides, Services, and Apostille Resources`,
      description: `Search ${SITE_NAME} to find articles, guides, pricing information, timelines, and help topics. Filter results to quickly discover the resources you need to complete your document tasks.`,
      enabled: true,
      index: true,
      sitemap: false,
      showInHeaderNav: true,
      path: "/search/",
      location: "content/pages/Search.astro",
    },
    notFound: {
      title: `Page Not Found — Let ${SITE_NAME} Help You Get Back on Track`,
      description: `We couldn't find that page on ${SITE_NAME}. Try our search, browse popular guides, or return home to explore services, pricing, timelines, and support for your apostille and attestation needs.`,
      enabled: true,
      index: false,
      sitemap: false,
      showInHeaderNav: false,
      showInFooterNav: false,
      path: "/404/",
      location: "content/pages/NotFound.astro",
    },
  },
};

// --- small helper to ensure ending slash for page-like URLs
function ensureTrailingSlashStr(u?: string): string {
  if (!u) return '';
  try {
    const isFile = /\.[a-z0-9]{2,8}$/i.test(new URL(u).pathname);
    if (isFile) return u; // don't add slash to files
  } catch {
    // if it's not absolute, fall back to simple string handling
  }
  return u.endsWith('/') ? u : `${u}/`;
}

// --- Normalize key URLs at load:
siteDefaults.siteUrl = ensureTrailingSlashStr(siteDefaults.siteUrl);
if (siteDefaults.siteUrl) {
  siteDefaults.siteUrl = ensureTrailingSlashStr(siteDefaults.siteUrl);
}
if ((siteDefaults as any).parentOrganization?.url) {
  (siteDefaults as any).parentOrganization.url =
    ensureTrailingSlashStr((siteDefaults as any).parentOrganization.url);
}

// Optional helpers (nice for use in pages / sitemap)
export const getPageCfg = (key: PageKey) => normalizePageFlags(siteDefaults.pages[key], key);
export const allPagesNormalized = (Object.keys(siteDefaults.pages) as PageKey[]).reduce<
  Record<PageKey, ReturnType<typeof normalizePageFlags>>
>((acc, k) => ((acc[k] = getPageCfg(k)), acc), {} as any);
