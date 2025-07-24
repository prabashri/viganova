export const siteDefaults = {
  siteName: "AstroWEB by Nviews WEB",
  publishedDate: "June 19 2025",
  adminName: "nviews web",
  adminEmail: "admin@nviewsweb.com",
  authorName: "Prabakaran Shankar",
  authorUrl: "https://prabakaranshankar.com",
  domainName: "astroweb.dev",
  siteUrl: "https://astroweb.dev",
  title: "Theme for Astro by nViewsWEB - The Ultimate Frontend Toolkit",
  description: "some description",
  keywords: ["Astro", "Theme", "Frontend", "Web Development", "CSS", "JavaScript"],
  twitterHandle: "@cnviewsweb",
  
  logo: "/logos/AstroWEB-logo.png",
  icon: "/logos/AstroWEB-icon.png",
  separator: "|",
  authors: [],
  rss: true,
  sitemap: true,
  noOfPostsPerPage: 3, // Number of posts to display per page in blog and post collections

  image: "/images/astro-theme-nviewsweb-main.png",
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

  // General thumbnail settings
  thumbnail: true,
  thumbnailSize: 120,

  collections: {
    blog: {
      index: true,
      base: 'blog',       // base path - used as /blog/slug/
      label: 'Blog',      // display label (optional)
      rss: true,          // should generate RSS?
      tags: true,
      authors: true, // enable authors in blog posts
    },
    post: {
      index: true,
      base: '',           // no prefix → /slug/
      label: 'Post',
      rss: true,
      tags: true,
      authors: true, // enable authors in posts
    },
    team: {
      index: true,
      base: 'team',
      label: 'Team',
      rss: false,
      tags: false
    }
  },


  tagMeta: [
    {
      name: "blog",
      title: "Blog Articles",
      image: "/tags/blog-image.png",
      url: "/tags/blog/",
      description: "Articles and guides related to responsive design techniques."
    },
    {
      name: "typography",
      title: "Typography Resources",
      image: "/tags/typography-image.png",
      url: "/tags/typography/",
      description: "Resources and tutorials on fluid and modern typography."
    },
    {
      name: "layout",
      title: "Layout Techniques",
      image: "/tags/layout-image.png",
      url: "/tags/layout/",
      description: "Discussions and tools for layout spacing, sizing, and CSS structure."
    }
  ],

  categoryMeta: [
    {
      name: "CSS Techniques",
      title: "CSS Techniques",
      image: "/categories/css-image.png",
      url: "/categories/css/",
      description: "Grouped tutorials and tools for mastering CSS layout, spacing, and typography."
    },
    {
      name: "Performance",
      title: "Performance",
      image: "/categories/performance-image.png",
      url: "/categories/performance/",
      description: "Articles focused on improving frontend and build performance."
    }
  ]
};
