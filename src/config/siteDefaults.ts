export const siteDefaults = {
  siteName: "Easy Apostille",
  shortName: "Easy Apostille",
  publishedDate: "June 19 2025",

  cloudflareUrl: "https://easyapostille.pages.dev",

  domainName: "easyapostille.in",
  siteUrl: "https://easyapostille.in",
  title: "Easy Apostille - Simplifying Document Apostille Attestation",
  description: "Easy Apostille is your trusted partner for hassle-free document apostille and attestation services. We simplify the process, ensuring your documents are authenticated and ready for international use.",
  keywords: ["Apostille Attestation", "Document Authentication", "Notary Process", "India Apostille Services"],

  socialLinks: {
    x: "@nviewsweb", // twitter handle without @
    github: "https://github.com/easyapostille",
    linkedin: "https://linkedin.com/company/nviewsweb",
    facebook: "https://facebook.com/nviewsweb",
    instagram: "https://instagram.com/nviewsweb",
    youtube: "https://youtube.com/@nviewsweb",
    mastodon: "https://mastodon.social/@nviewsweb",
    bluesky: "https://bsky.app/profile/nviewsweb.com",
    email: "mailto:admin@verifiedapostille.com"
  },

    // Admin contact (for technical/meta info)
  admin: {
    name: 'NViews Web',
    email: 'admin@nviewsweb.com'
  },

  // Organization block (main entity)
  organization: {
    // Set entity type dynamically: 'Organization' or 'Person'
    type: 'Organization', // Change to 'Person' if site is personal brand

    // Common fields (both Organization & Person use name, url, logo, sameAs)
    name: 'NViews Web', // or 'Prabakaran Shankar' if type = 'Person'
    url: 'https://nviewsweb.com', // or personal website
    email: 'admin@nviewsweb.com',
    logo: 'src/assets/logos/AstroWEB-logo.png',
    sameAs: [
      'https://linkedin.com/company/nviewsweb',
      'https://prabakaranshankar.com'
    ],

    // Only relevant if type is Organization
    incharge: { // for person, no need to fill this
      type: 'Person',
      name: 'Prabakaran Shankar',
      email: 'madanprabakar@gmail.com',
      image: '',
      url: 'https://prabakaranshankar.com',
      internalId: 'team/prabakaran-shankar',
      // only if dont have internalId
      sameAs: [
        'https://linkedin.com/in/prabakaranshankar',
        'https://x.com/@madanpraba'
      ]
    }
  },

  shareLinks: [
    "Whatsapp",
    "X",
    "Facebook",
    "LinkedIn",
    "Reddit",
    "Copy Link",
    "Email",
  ],

  separator: "|",
  
  rss: true,
  sitemap: true,
  cdnPath: "",
  noOfPostsPerPage: 3, // Number of posts to display per page in blog and post collections

  image: "/featured/astroweb-modern-website-theme-astro.png",
  imageAlt: "design to represent the nviewsweb astro theme using text and images",
  imageTitle: "nViewsWEB Astro Theme",
  imageVariants: [
    320, // standard width for mobile devices
    640,  // standard width for tablets, content width
    1280, // standard width to support image seo according to google's image seo guidelines
  ],
  imageFormats: [ // upload png images, and this script will generate resized variants in these formats
    'avif', // supports modern browsers - most efficient
    'webp', // supports modern browsers - widely used
    // 'jpeg' //  only select if you need jpeg fallback
    // jpg  // 
  ],   
  compressionLevel: 80, // default quality if not overridden

  outputImageBase: './public/images', // fixed output folder

  inputImageFolder: './src/assets/images', // user-editable image folder
  featuredImageFolder: './src/assets/images/featured', // featured images only
  featuredImageSize: 960, // larger size for SEO & cards

  // ✅ Breakpoint config for responsive images
  breakpoints: {
    mobileMax: 768,   // `(max-width: 768px)`
    desktopMin: 769   // `(min-width: 769px)`
  },
  // General thumbnail settings
  thumbnail: true,
  thumbnailSize: 120,

  postsPerCollectionsPage: 2, // Number of posts per page in collections like blog, post, etc.

  fieldCollections: {
    tags: {
      label: "Tags",
      title: "Tags Collection",
      description: "Tags are used to categorize content across the site.",
      meta: "tagMeta",
      defaultImage: "tags/astroweb.png",
      maxPerEntry: 5,
      sitemapMinPosts: 5 // Minimum posts to include in sitemap
    },
    categories: {
      label: "Categories",
      title: "Categories Collection",
      description: "Categories are used to group related content.",
      meta: "categoryMeta",
      defaultImage: "tags/astroweb.png",
      maxPerEntry: 3,
      sitemapMinPosts: 5 // Minimum posts to include in sitemap
    }
  },

  collections: {
    blog: {
      index: true,
      sitemap: true, // sitemap enabled for blog
      base: 'blog',       // base path - used as /blog/slug/
      label: 'Blog',      // display label (optional)
      rss: true,          // should generate RSS?
      tags: true,
      categories: true, // enable categories in blog posts
      authors: true, // enable authors in blog posts
      search: true, // enable search indexing for blog posts
    },
    post: {
      index: true,
      sitemap: true,
      base: '',           // no prefix → /slug/
      label: 'Post',
      rss: true,
      tags: true,
      categories: true, // enable categories in posts
      authors: true, // enable authors in posts
      search: true, // enable search indexing for posts
    },
    team: {
      index: true,
      sitemap: true,
      base: 'team',
      label: 'Team',
      rss: false,
      tags: false,
      categories: false,
      search: false
    },    
  },

  searchPages: ["home"], // this is not added  in the search index function
  searchIndexPath: "/search-index.json",

  serviceWorkerPaths: [ // paths including fonts, css, js to cache in service worker
    //'/fonts/Inter-Regular-Subset.woff2',
    //'/fonts/Inter-Bold-Subset.woff2',
  ],

  
};
