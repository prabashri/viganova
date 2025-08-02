export const siteDefaults = {
  siteName: "AstroWEB by Nviews WEB",
  shortName: "AstroWEB",
  publishedDate: "June 19 2025",
  adminName: "nviews web",
  adminEmail: "admin@nviewsweb.com",
  authorName: "Prabakaran Shankar",
  authorUrl: "https://prabakaranshankar.com",
  domainName: "astroweb.dev",
  siteUrl: "https://astroweb.dev",
  title: "Theme for Astro by nViewsWEB - The Ultimate Frontend Toolkit",
  description: "Modern, performance-first Astro theme by NViewsWeb. Perfect for looking responsive, SEO-friendly design, and a+ security.",
  keywords: ["Astro", "Theme", "Frontend", "Web Development", "CSS", "JavaScript"],

  socialLinks: {
    x: "@nviewsweb", // twitter handle without @
    github: "https://github.com/nviewsweb",
    linkedin: "https://linkedin.com/company/nviewsweb",
    facebook: "https://facebook.com/nviewsweb",
    instagram: "https://instagram.com/nviewsweb",
    youtube: "https://youtube.com/@nviewsweb",
    mastodon: "https://mastodon.social/@nviewsweb",
    bluesky: "https://bsky.app/profile/nviewsweb.com",
    email: "mailto:admin@nviewsweb.com"
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
  authors: [],
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
  featuredImageFolder: './src/assets/featured', // featured images only
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
      maxPerEntry: 5
    },
    categories: {
      label: "Categories",
      title: "Categories Collection",
      description: "Categories are used to group related content.",
      meta: "categoryMeta",
      defaultImage: "tags/astroweb.png",
      maxPerEntry: 3
    }
  },

  collections: {
    blog: {
      index: true,
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
