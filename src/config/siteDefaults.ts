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
  image: "/images/astro-theme-nviewsweb-main.png",
  imageAlt: "design to represent the nviewsweb astro theme using text and images",
  imageTitle: "nViewsWEB Astro Theme",
  logo: "/logos/AstroWEB-logo.png",
  icon: "/logos/AstroWEB-icon.png",
  separator: "|",
  rss: true,
  sitemap: true,


 
  collections: {
    blog: {
      index: true,
      base: 'blog',        // base path → used as /blog/slug/
      label: 'Blog',       // display label (optional)
      rss: true,           // should generate RSS?
    },
    post: {
      index: true,
      base: '',            // no prefix → /slug/
      label: 'Post',
      rss: true,
    },
    team: {
      index: true,
      base: 'team',
      label: 'Team',
      rss: false,
    }
  },


  tagMeta: [
    {
      name: "responsive",
      url: "/tags/responsive/",
      description: "Articles and guides related to responsive design techniques."
    },
    {
      name: "typography",
      url: "/tags/typography/",
      description: "Resources and tutorials on fluid and modern typography."
    },
    {
      name: "layout",
      url: "/tags/layout/",
      description: "Discussions and tools for layout spacing, sizing, and CSS structure."
    }
  ],

  categoryMeta: [
    {
      name: "CSS Techniques",
      url: "/categories/css/",
      description: "Grouped tutorials and tools for mastering CSS layout, spacing, and typography."
    },
    {
      name: "Performance",
      url: "/categories/performance/",
      description: "Articles focused on improving frontend and build performance."
    }
  ]
};
