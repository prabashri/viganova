// /src/content/config.ts
import { defineCollection, reference, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

/* ---------------- Shared shapes ---------------- */

/** Accept absolute URL, site-relative path (/...), or hash (#...) */
const urlOrPath = z.string().refine((s) => {
  if (typeof s !== 'string' || s.length === 0) return false;
  // absolute http(s) URL
  try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch {}
  // site-relative path or hash
  return s.startsWith('/') || s.startsWith('#');
}, { message: 'Must be an absolute URL, site-relative path ("/..."), or hash ("#...").' });

const offerItemSchema = z.object({
  /** pricing.ts key, e.g. "sdmBundle" */
  priceKey: z.string(),
  /** optional display name override; else pricing.ts name is used */
  name: z.string().optional(),
  /** optional buy-now or CTA URL for *this* offer (overrides pricing.ts buyNowLink) */
  buyNowLink: z.string().url().optional(),

});


const serviceSchema = z
  .object({
    /** New, unambiguous field */
    offers: z.array(offerItemSchema).optional(),
    type: z.string().optional(),  // e.g. "service"
  })

const captionSchema = z.object({
  url: z.string(),                  // .vtt or .srt
  lang: z.string(),                 // BCP-47 (e.g. "en", "ko-KR")
  kind: z.enum(['subtitles','captions','descriptions','chapters','metadata']).optional(),
  label: z.string().optional(),
  default: z.boolean().optional(),
});

const chapterSchema = z.object({
  name: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative().optional(),
});

const relatedPostSchema = z.object({
  title: z.string(),
  url: z.string(),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
  speakable: z.boolean().optional(),
});

const platformSchema = z.object({
  spotify: z.string().url().optional(),
  apple: z.string().url().optional(),
  soundcloud: z.string().url().optional(),
  google: z.string().url().optional(),
  amazon: z.string().url().optional(),
  youtube: z.string().url().optional(),       // optional extra
  youtubeMusic: z.string().url().optional(),
  pocketCasts: z.string().url().optional(),
  overcast: z.string().url().optional(),
  castbox: z.string().url().optional(),
  stitcher: z.string().url().optional(),
  tunein: z.string().url().optional(),
  iheartradio: z.string().url().optional(),
  deezer: z.string().url().optional(),
  rss: urlOrPath.optional(),
}).partial();

/* ---------------- Base frontmatter for article-like content ---------------- */
/** Adds cross-links to canonical media (videos + audio) and lightweight embed hints */
const baseSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    authors: z.array(reference('team')),
    publishedDate: z.string(),
    lastModified: z.string().optional(),
    slug: z.string(),
    canonicalUrl: z.string().optional(),

    heroImage: z.string().optional(),
    heroImageAlt: z.string().optional(),
    heroImageTitle: z.string().optional(),
    heroImageCaption: z.string().optional(),

    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    index: z.boolean().default(true),

    faq: z.array(faqItemSchema).optional(),

    relatedPosts: z.array(relatedPostSchema).optional(),

    /* Link to canonical VideoObject/AudioObject watch/listen pages */
    videoWatchPageUrl: z.string().optional(),
    videoContentUrl: z.string().optional(),
    audioListenPageUrl: z.string().optional(),
    audioContentUrl: z.string().optional(),
    
  });

/* ---------------- Article-like collections ---------------- */

const blog = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/blog' }),
  schema: baseSchema,
});

const service = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/service' }),
  schema: (ctx: SchemaContext) => baseSchema(ctx).merge(serviceSchema),
});
const resource = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/resource' }),
  schema: baseSchema,
});

const post = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/post' }),
  schema: baseSchema,
});

/* ---------------- Team ---------------- */

const team = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/team' }),
  schema: () =>
    z.object({
      name: z.string(),
      slug: z.string(),
      prefix: z.string().optional(),
      role: z.string(),
      highestDegree: z.string().optional(),
      shortBio: z.string(),
      experience: z.number().int().nonnegative().optional(),
      expertise: z.array(z.string()),
      awards: z.array(z.string()).optional(),
      affiliation: z.string().optional(),
      addressing: z.string().optional(),
      email: z.string().email(),
      website: z.string().url().optional(),
      color: z.string().optional(),
      joined: z.string().optional(),
      left: z.string().optional(),

      useGravatar: z.boolean().default(false),
      gravatarEmail: z.string().email().optional(),
      useImage: z.boolean().default(false),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      useInitial: z.boolean().optional(),
      initialText: z.string().max(2).optional(),
      profileImage: z.string().optional(),
      profileImageAlt: z.string().optional(),
      profileImageCaption: z.string().optional(),
      profileImageTitle: z.string().optional(),
      social: z.object({
        twitter: z.string().url().optional(),
        github: z.string().url().optional(),
        linkedin: z.string().url().optional(),
        instagram: z.string().url().optional(),
        youtube: z.string().url().optional(),
        mastodon: z.string().url().optional(),
        threads: z.string().url().optional(),
      }).optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().default(false),
      index: z.boolean().default(true),
    }),
});

/* ---------------- Videos (watch pages are canonical VideoObjects) ---------------- */

const videos = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/videos' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      // Page basics (this page is the canonical watch page)
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      publishDate: z.string(),                 // ISO date preferred
      updatedDate: z.string().optional(),
      image: z.string().optional(),            // hero image if different from poster
      imageAlt: z.string().optional(),         // imageAlt
      imageTitle: z.string().optional(),      // imageTitle
      imageCaption: z.string().optional(),    // imageCaption
      tags: z.array(z.string()).default([]),
      keywords: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().default(false),
      index: z.boolean().default(true),

      // Canonical video metadata (single source of truth)
      provider: z.enum(['self','youtube','vimeo','embed']),
      // Canonical watch page URL (optional override; default is built from site + slug)
      watchPageUrl: z.string().url().optional(),

      // Source/IDs
      contentUrl: z.string().optional(),       // self-hosted .mp4/.webm/.m3u8
      youtubeId: z.string().optional(),
      vimeoId: z.string().optional(),
      embedUrl: z.string().optional(),

      // Core info
      uploadDate: z.string().optional(),       // ISO 8601
      durationSeconds: z.number().int().positive().optional(),
      isLive: z.boolean().optional(),
      isFamilyFriendly: z.boolean().optional(),

      // Visuals
      // poster: z.string().optional(),
      // posterAlt: z.string().optional(),                  // NEW
      // posterWidth: z.number().int().positive().optional(),  // NEW
      // posterHeight: z.number().int().positive().optional(), // NEW
      // thumbnails: z.array(thumbnailSchema).optional(),
      
      // ⚠️ Use these for the video/player dimensions (not thumbnails)
      videoWidth: z.number().int().positive().optional(),   // RENAMED
      videoHeight: z.number().int().positive().optional(),  // RENAMED
      aspectRatio: z.string().regex(/^\d+:\d+$/).optional(),
      
      // Tracks & chapters
      captions: z.array(captionSchema).optional(),
      transcriptUrl: urlOrPath.optional(),
      chapters: z.array(chapterSchema).optional(),

      faq: z.array(faqItemSchema).optional(),

      // Access / regions
      requiresSubscription: z.boolean().optional(),
      regionsAllowed: z.array(z.string()).optional(),       // ISO 3166-1 alpha-2

      // Cross-links
      platform: z.object({
        youtube: z.string().url().optional(),
        vimeo: z.string().url().optional(),
        dailymotion: z.string().url().optional(),
        bilibili: z.string().url().optional(),
        rumble: z.string().url().optional(),
      }).optional(),
      sameAs: z.array(z.string().url()).optional(),
      relatedArticles: z.array(z.string()).default([]),
    }).refine((d) => {
      if (d.provider === 'self') return !!d.contentUrl;
      if (d.provider === 'youtube') return !!d.youtubeId || !!d.platform?.youtube;
      if (d.provider === 'vimeo') return !!d.vimeoId || !!d.platform?.vimeo;
      if (d.provider === 'embed') return !!d.embedUrl;
      return false;
    }, { message: 'Provider requires the matching id/url field.' }),
});

/* ---------------- Audio (listen pages are canonical AudioObjects) ---------------- */
export const audio = defineCollection({
  loader: glob({ pattern: '**/*.(md|mdx)', base: './src/content/audio' }),
  schema: ({ image }: SchemaContext) =>
    z.object({
      // Page basics (canonical listen page)
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      publishDate: z.string(),
      updatedDate: z.string().optional(),

      // Unified hero (used for poster/social/preview)
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      imageTitle: z.string().optional(),
      imageCaption: z.string().optional(),

      tags: z.array(z.string()).default([]),
      keywords: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().default(false),
      index: z.boolean().default(true),

      // Canonical audio metadata
      provider: z.enum(['self','spotify','apple','soundcloud','youtube','embed']),
      listenPageUrl: z.string().url().optional(),

      // Source / IDs
      contentUrl: urlOrPath.optional(),           // self
      embedUrl: z.string().url().optional(),      // generic embed
      encodingFormat: z.string().optional(),      // e.g. 'audio/mpeg'

      // Legacy platform fields (will be mapped → platform.* in transform)
      spotifyUrl: z.string().url().optional(),
      applePodcastsUrl: z.string().url().optional(),
      soundcloudUrl: z.string().url().optional(),
      youtubeId: z.string().optional(),
      rssGuid: z.string().optional(),

      // New platform object
      platform: platformSchema.optional(),

      // Core info
      uploadDate: z.string().optional(),
      durationSeconds: z.number().int().positive().optional(),
      isLive: z.boolean().optional(),
      isFamilyFriendly: z.boolean().optional(),
      isAccessibleForFree: z.boolean().optional(),
      requiresSubscription: z.boolean().optional(),

      // Optional display hints
      audioWidth: z.number().int().positive().optional(),
      audioHeight: z.number().int().positive().optional(),
      aspectRatio: z.string().regex(/^\d+:\d+$/).optional(),

      // Media extras
      captions: z.array(captionSchema).optional(),
      waveformUrl: urlOrPath.optional(),

      // Series / episode metadata
      seriesTitle: z.string().optional(),
      seasonNumber: z.number().int().positive().optional(),
      episodeNumber: z.number().int().positive().optional(),

      // Chapters & transcript
      chapters: z.array(chapterSchema).optional(),
      transcriptUrl: urlOrPath.optional(),

      // Cross-links
      sameAs: z.array(z.string().url()).optional(),
      relatedArticles: z.array(z.string()).default([]),
    })
    .transform((d) => {
      // Back-compat: fold legacy fields into platform
      const platform: Record<string, string | undefined> = {
        ...(d.platform ?? {}),
        spotify: d.platform?.spotify ?? d.spotifyUrl,
        apple: d.platform?.apple ?? d.applePodcastsUrl,
        // soundcloud can stay as embedUrl or separate link:
        // If you want to treat it as a platform link:
        soundcloud: d.platform?.soundcloud ?? d.soundcloudUrl,
        youtube: d.platform?.youtube ?? (d.youtubeId ? `https://www.youtube.com/watch?v=${d.youtubeId}` : undefined),
      };

      return { ...d, platform };
    })
    .refine((d) => {
      // Provider guard — accept new platform.* or legacy fields
      switch (d.provider) {
        case 'self':      return !!d.contentUrl;
        case 'spotify':   return !!(d.platform?.spotify || d.spotifyUrl);
        case 'apple':     return !!(d.platform?.apple || d.applePodcastsUrl);
        case 'soundcloud':return !!(d.platform?.soundcloud || d.soundcloudUrl || d.embedUrl);
        case 'youtube':   return !!(d.youtubeId || d.platform?.youtube);
        case 'embed':     return !!d.embedUrl;
        default:          return false;
      }
    }, { message: 'Provider requires the matching id/url field (platform.* or legacy field).' }),
});

/* ---------------- Reviews ---------------- */

const review = defineCollection({
  type: "data",
  schema: z.object({
    id: z.string(),
    headline: z.string(),
    body: z.string().max(1000), // plain text; keep short
    rating: z.number().min(1).max(5),
    language: z.string().default("en"),
    datePublished: z.string(), // ISO
    url: z.string().optional(),
    target: z.object({
      type: z.enum(["Service","Product","Organization"]).default("Organization"),
      name: z.string().optional(), // e.g., "Document Apostille", "Courier Add-on", business name
      url: z.string().optional()
    }).default({ type: "Organization" }),
    author: z.object({
      type: z.enum(["Person","Organization"]).default("Person"),
      name: z.string(),
      designation: z.string().optional(),
      organization: z.string().optional(),
      profileUrl: z.string().optional(),
      avatar: z.string().optional()
    }),
    service: z.object({ slug: z.string(), name: z.string() }).optional(),
    location: z.object({
      name: z.string().optional(),
      city: z.string().optional(),
      countryCode: z.string().optional()
    }).optional(),                                                                                                                                                                                                                                                             
    verifiedPurchase: z.boolean().optional(),
    orderNumber: z.string().optional(),
    pros: z.array(z.string()).default([]),
    cons: z.array(z.string()).default([]),
    media: z.array(z.object({
      type: z.enum(["image","video"]).default("image"),
      url: z.string(),
      width: z.number().optional(),
      height: z.number().optional(),
      alt: z.string().optional()
    })).default([]),
    ownerResponse: z.object({
      date: z.string(),
      text: z.string(),
      responder: z.string().optional()
    }).optional(),
    helpful: z.number().default(0),
    notHelpful: z.number().default(0)
  })
});



/* ---------------- Export all ---------------- */

export const collections = { blog, service, resource, post, team, videos, audio, review };
