// src/config/siteDefaults.ts
import type { StaticPageDefaults, PageFlags, PageKey } from '../types/siteDefaults';
import { normalizePageFlags } from '../types/siteDefaults';

const SITE_NAME = "VigaNova";
const CONTACT_EMAIL = "contact@viganova.com";

export const siteDefaults = {
  siteName: SITE_NAME,
  shortName: "VigaNova",
  publishedDate: "September 12 2025",

  cloudflareUrl: "https://viganova.pages.dev",

  domainName: "viganova.com",
  siteUrl: "https://viganova.com/", // ensure trailing slash

  title: `Viga Nova Green Energy Solutions`,
  description:
    "Empowering the world's transition to a hydrogen-powered, carbon-neutral future through innovation in green energy and advanced electrolyzer technologies.",
  keywords: [
    "green energy",
    "sustainability",
    "renewable energy",
    "solar power",
    "hydrogen energy solutions",
    "electrolyzers"
  ],

  socialLinks: {
    x: "viganova", // handle WITHOUT @
    // github: "https://github.com/VigaNova",
    // linkedin: "https://linkedin.com/company/VigaNova",
    facebook: "https://facebook.com/viganova",
    instagram: "https://instagram.com/viganova",
    // youtube: "https://youtube.com/@VigaNova",
    // mastodon: "https://mastodon.social/@VigaNova",
    // bluesky: "https://bsky.app/profile/VigaNova",
    email: CONTACT_EMAIL,
  },

  // Admin contact (for technical/meta info)
  admin: {
    name: "NViews Web",
    email: "admin@nviewsweb.com",
  },

  contact: {
    email: CONTACT_EMAIL,
    phone: "+919715359576",
    whatsapp: "919715359576",
    phone2: "",
    whatsapp2: "",
  },
  address: {
    streetAddress: "46/1, Thiyagarajapuram Road, Sankarapuram",
    addressLocality: "Villupuram",
    addressRegion: "Tamil Nadu",
    postalCode: "606401",
    addressCountry: "India",
    addressCountryCode: "IN", // ISO 3166-1 alpha-2
    googleMap: "",
  },

  // incharge of the organization (main contact person)
  incharge: {
    type: "Person",
    name: "Ganesh Kumar Mani",
    email: "ganesh@viganova.com",
    jobTitle: "Founder & CEO",
    contact: {
      email: "ganesh@viganova.com",
      phone: "+919715359576",
      whatsapp: "919715359576",
    },
    image: "",
    url: "https://www.linkedin.com/in/ganesh-kumar-mani-07700482",
    internalId: "", // team/ganesh-kumar-mani/
    // only if dont have internalId
    sameAs: [
      "https://www.linkedin.com/in/ganesh-kumar-mani-07700482",    
    ],
  },

  organizationType: "Organization",

  jurisdictionCountry: "IN",
  jurisdictionRegion: "TN-Villupuram",
  foundingDate: "2025-10-10",
  // dissolutionDate: '',
  legalName: "Viga Nova Green Energy Private Limited",
  taxId: "",
  taxLabel: "GSTIN",
  registrationId: "U20119TN2025PTC185265",
  registrationLabel: "CIN",

  founder: [
    {
      type: "Person",
      name: "TAMILSELVAN",
      email: "tamilselvan@viganova.com",
      jobTitle: "Co-Founder",
      contact: {
        email: "tamilselvan@viganova.com",
        phone: "+91xxxxxxxxxx",
        whatsapp: "91xxxxxxxxxx",
      },
      image: "",
      url: "https://viganova.com/team/tamilselvan",
      internalId: "team/tamilselvan/",
      sameAs: [
        "https://linkedin.com/in/tamilselvan",
      ],
    },
    {
      type: "Person",
      name: "SINRAJ SIVAKUMAR",
      email: "sinraj@viganova.com",
      jobTitle: "Co-Founder",
      contact: {
        email: "sinraj@viganova.com",
        phone: "+91yyyyyyyyyy",
        whatsapp: "91yyyyyyyyyy",
      },
      image: "",
      url: "https://viganova.com/team/sinraj",
      internalId: "team/sinraj/",
      sameAs: [
        "https://linkedin.com/in/sinraj",
      ],
    },
  ],

  /**
   * add svg in public/icons/ and name here
   */
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
      index: false,
      sitemap: false,
      base: "blog",
      label: "Blog",
      title: "Blog",
      description: "Latest articles and updates",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: false,
    },
    service: {
      index: false,
      sitemap: false,
      base: "services",
      label: "Services",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: true,
    },
    resource: {
      index: false,
      sitemap: false,
      base: "resources",
      label: "Resources",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: true,
    },
    post: {
      index: false,
      sitemap: false,
      base: "",
      label: "Post",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: false,
    },
    videos: {
      index: false,
      sitemap: false,
      base: "videos",
      label: "Videos",
      rss: true,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: false,
    },
    audio: {
      index: false,
      sitemap: false,
      base: "audio",
      label: "Audio",
      rss: false,
      tags: true,
      categories: true,
      authors: true,
      search: true,
      showInFooterNav: false,
    },
    review: {
      index: false,
      sitemap: false,
      base: "reviews",
      label: "Reviews",
      rss: false,
      tags: false,
      categories: false,
      authors: false,
      search: false,
      showInFooterNav: true,
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
      showInFooterNav: true,
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
      label: "Privacy Policy",
      icon: "shield-check",
      title: `Privacy Policy — How ${SITE_NAME} Collects, Uses & Protects Your Data`,
      description: `Learn how ${SITE_NAME} collects, uses, and safeguards your information when you explore our green hydrogen and clean energy solutions. We explain cookies, analytics, limited retention, and your choices in clear, human-readable language.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/privacy-policy/",
      location: "content/pages/PrivacyPolicy.astro",
    },
    cookiePolicy: {
      label: "Cookie Policy",
      icon: "cookie",
      title: `Cookie Policy — How ${SITE_NAME} Uses Cookies & Similar Technologies`,
      description: `Understand how ${SITE_NAME} uses essential, functional, and analytics cookies to improve your experience, and how you can manage your preferences.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/cookie-policy/",
      location: "content/pages/CookiePolicy.astro",
    },
    contact: {
      label: "Contact Us",
      icon: "phone",
      title: `Contact ${SITE_NAME} — Green Hydrogen Projects, Partnerships & Support`,
      description: `Reach ${SITE_NAME} to discuss green hydrogen projects, electrolyzer solutions, pilot deployments, partnerships, or general inquiries. Share your requirements and our team will help you explore the right clean energy pathway.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInHeaderNav: true,
      showInFooterNav: true,
      path: "/contact-us/",
      location: "content/pages/Contact.astro",
    },
    about: {
      label: "About Us",
      icon: "info-circle",
      title: `About ${SITE_NAME} — Advancing Green Hydrogen & Clean Energy Innovation`,
      description: `Discover how ${SITE_NAME} is building a hydrogen-powered, carbon-neutral future through advanced electrolyzer technologies and integrated green energy solutions for industry, infrastructure, and communities.`,
      enabled: true,
      index: true,
      sitemap: true,
      showInFooterNav: true,
      path: "/about-us/",
      location: "content/pages/About.astro",
    },
    terms: {
      label: "Terms & Conditions",
      icon: "file-text",
      title: `Terms & Conditions — Legal Terms for Using ${SITE_NAME} Services`,
      description: `Read the terms and acceptable use for ${SITE_NAME}. This page covers website usage, limitations, disclaimers, and other legal conditions related to our green hydrogen, consulting, and technology services.`,
      enabled: false,
      index: false,
      sitemap: false,
      showInFooterNav: false,
      path: "/terms/",
      location: "content/pages/Terms.astro",
    },
    refund: {
      label: "Refund Policy",
      icon: "arrow-uturn-left",
      title: `Refund Policy — Terms for Refunds and Cancellations at ${SITE_NAME}`,
      description: `Understand the refund and cancellation terms for feasibility studies, consulting engagements, training programs, and other services at ${SITE_NAME}. This page explains eligibility, timelines, and applicable conditions.`,
      enabled: false,
      index: false,
      sitemap: false,
      showInFooterNav: false,
      path: "/refund-policy/",
      location: "content/pages/Refund.astro",
    },
    search: {
      label: "Search",
      icon: "search",
      title: `Search ${SITE_NAME} — Explore Hydrogen Insights, Projects & Services`,
      description: `Search ${SITE_NAME} to quickly find articles, project highlights, technology overviews, FAQs, and service information related to green hydrogen, electrolyzers, and renewable energy solutions.`,
      enabled: true,
      index: true,
      sitemap: false,
      showInHeaderNav: true,
      path: "/search/",
      location: "content/pages/Search.astro",
    },
    notFound: {
      label: "404 Not Found",
      icon: "alert-triangle",
      title: `Page Not Found — Let ${SITE_NAME} Guide Your Clean Energy Journey`,
      description: `We couldn't find that page on ${SITE_NAME}. Try our search, browse our hydrogen knowledge resources, or return home to explore our technologies, services, and vision for a carbon-neutral future.`,
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
