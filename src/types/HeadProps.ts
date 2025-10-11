// src/types/HeadProps.ts

/* =========
 * Aliases
 * ========= */
export type URLString = string;      // "https://..." or "/path"
export type ISODateString = string;  // "2025-09-03T09:00:00Z"
export type Seconds = number;

/* =========================
 * Shared simple structures
 * ========================= */
export interface CollectionItem {
  name: string;
  url: URLString;
}

export type PageTypes =
  | 'website' | 'webpage' | 'article' | 'collection' | 'list'
  | 'person' | 'service' | 'product' | 'event' | 'publication'
  | 'video' | 'audio' | 'listen' | 'contact' | 'about' | '404'
  | 'search' | 'terms' | 'privacy' | 'cookie' | 'review' | 'faq' | 'howto'
  | 'watch' | 'watchpage' | 'listenpage' | 'podcast' | 'medical' | 'item' | 'qa' | 'profile';

export interface FaqItem {
  question: string;
  answer: string;
  /** true -> include in SpeakableSpecification */
  speakable?: boolean;
}

export interface BreadcrumbItem {
  /** Full canonical name for Schema.org JSON-LD (keep untrimmed). */
  name: string;
  /** Absolute URL of the crumb. */
  url: URLString;
  /** Optional short UI label; falls back to `name` if omitted. */
  label?: string;
}

/* ================
 * Media primitives
 * ================ */
export interface Chapter {
  name: string;
  start: Seconds;
  end?: Seconds;
  url?: URLString; // deep link to chapter (e.g., ?t=123)
}

export interface CaptionTrack {
  url: URLString;       // .vtt/.srt
  lang: string;         // BCP-47 (e.g., "en", "ko-KR")
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  label?: string;
  default?: boolean;
}

export interface Thumbnail {
  url: URLString;
  width?: number;
  height?: number;
  alt?: string;         // used for og:image:alt & twitter:image:alt
}

/** Convenience links to platforms */
export interface PlatformLinks {
  youtube?: URLString;       // canonical watch URL if applicable
  vimeo?: URLString;         // canonical watch/player URL
  dailymotion?: URLString;
  bilibili?: URLString;
  rumble?: URLString;
  spotify?: URLString;       // for audio convenience
  applePodcasts?: URLString; // for audio convenience
  googlePodcasts?: URLString;// legacy but still used
  soundcloud?: URLString;    // for audio convenience
}

/* ==================
 * Video / Audio meta
 * ================== */
export type VideoProvider = 'self' | 'youtube' | 'vimeo' | 'embed';
export type AudioProvider = 'self' | 'spotify' | 'apple' | 'soundcloud' | 'youtube' | 'embed';

/**
 * Canonical video metadata aligned with:
 * - schema.org/VideoObject (incl. MediaObject fields)
 * - Open Graph video tags (og:video:*)
 * - Twitter Player Card
 */
export interface VideoMeta {
  provider: VideoProvider;

  /* Canonical pages & source */
  watchPageUrl?: URLString;          // indexable canonical watch page
  contentUrl?: URLString;            // self-hosted MP4/WebM/HLS/DASH master
  contentUrlHls?: URLString;         // .m3u8
  contentUrlDash?: URLString;        // .mpd
  encodingFormat?: string;           // e.g., "video/mp4"
  contentSizeBytes?: number;         // for schema MediaObject contentSize
  embedUrl?: URLString;              // iframe src
  youtubeId?: string;
  vimeoId?: string;

  /* OG/Twitter player specifics (optional, but helpful for rich cards) */
  ogVideoUrl?: URLString;            // og:video
  ogVideoSecureUrl?: URLString;      // og:video:secure_url
  ogVideoType?: string;              // e.g., "text/html" or "video/mp4"
  ogVideoWidth?: number;
  ogVideoHeight?: number;
  twitterPlayerUrl?: URLString;      // twitter:player
  twitterPlayerWidth?: number;
  twitterPlayerHeight?: number;

  /* Identity / basics */
  name?: string;
  description?: string;
  uploadDate?: ISODateString;        // ISO
  durationSeconds?: Seconds;
  isLive?: boolean;
  isFamilyFriendly?: boolean;
  isAccessibleForFree?: boolean;     // schema.org recommendation
  requiresSubscription?: boolean;

  /* Visuals (for schema + OG/Twitter) */
  poster?: URLString;                // preferred hero image
  posterAlt?: string;
  posterWidth?: number;
  posterHeight?: number;
  thumbnails?: Thumbnail[];          // first item used as fallbacks
  width?: number;                    // intrinsic or player width
  height?: number;                   // intrinsic or player height
  aspectRatio?: `${number}:${number}` | undefined; // e.g., "16:9"

  /* Rich media details */
  captions?: CaptionTrack[];         // subtitle/caption tracks
  transcriptUrl?: URLString;         // full transcript file/page url
  chapters?: Chapter[];

  /* Access / geo */
  regionsAllowed?: string[];         // ISO 3166-1 alpha-2 codes

  /* Cross-links */
  sameAs?: URLString[];              // authoritative duplicates
  platform?: PlatformLinks;          // explicit platform links

  /* Technical hints */
  bitrateKbps?: number;
  frameRate?: number;

  /**
   * If true, this media is the main entity of the current page
   * (use on the actual watch page to output JSON-LD mainEntityOfPage).
   */
  isMainEntity?: boolean;
}

/**
 * Canonical audio metadata aligned with:
 * - schema.org/AudioObject/PodcastEpisode
 * - Open Graph (og:audio:* limited) & Twitter summary/player
 */
export interface AudioMeta {
  provider: AudioProvider;

  /* Canonical pages & source */
  listenPageUrl?: URLString;         // indexable canonical listen page
  contentUrl?: URLString;            // self-hosted .mp3/.m4a/.opus
  encodingFormat?: string;           // e.g., "audio/mpeg"
  contentSizeBytes?: number;
  embedUrl?: URLString;              // iframe src
  youtubeId?: string;                // for YouTube-distributed audio
  rssGuid?: string;

  /* Platform links */
  spotifyUrl?: URLString;
  applePodcastsUrl?: URLString;
  googlePodcastsUrl?: URLString;
  soundcloudUrl?: URLString;

  /* Identity / basics */
  name?: string;
  description?: string;

  uploadDate?: ISODateString;
  durationSeconds?: Seconds;
  isLive?: boolean;
  isFamilyFriendly?: boolean;
  isAccessibleForFree?: boolean;
  requiresSubscription?: boolean;

  /* Visuals (cover art for OG/Twitter) */
  image?: URLString;                 // square cover
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  thumbnails?: Thumbnail[];          // optional alternates
  waveformUrl?: URLString;

  /* Episode / series */
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;

  /* Rich details */
  chapters?: Chapter[];
  transcriptUrl?: URLString;

  captions?: CaptionTrack[];

  /* Cross-links */
  sameAs?: URLString[];

  /** See VideoMeta.isMainEntity */
  isMainEntity?: boolean;

  /* Optional player hints */
  twitterPlayerUrl?: URLString;
  twitterPlayerWidth?: number;
  twitterPlayerHeight?: number;

  regionsAllowed?: string[];

  platform: {
    spotify?: URLString | undefined;
    apple?: URLString | undefined;
    google?: URLString | undefined;
    amazon?: URLString | undefined;
    youtubeMusic?: URLString | undefined;
    pocketCasts?: URLString | undefined;
    overcast?: URLString | undefined;
    castbox?: URLString | undefined;
    stitcher?: URLString | undefined;
    tunein?: URLString | undefined;
    iheartradio?: URLString | undefined;
    deezer?: URLString | undefined;
    rss?: URLString | undefined;
  },

}

/* ==========
 * HeadProps
 * ========== */
export interface HeadProps {
  // Core
  title: string;
  description?: string;

  /**
   * Default social image for the page (OG/Twitter).
   * Use when not overridden by video.poster or audio.image.
   */
  image?: URLString;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;

  type?: PageTypes;
   
  url?: URLString;                  // current page URL
  canonicalUrl?: URLString;

  // Site & authorship
  siteName?: string;
  authors?: Array<{ name: string; url?: URLString; data?: any }>;
  publishedAt?: string;
  updatedAt?: string;
  publishedAtISO?: ISODateString;
  updatedAtISO?: ISODateString;

  // Robots / indexing
  index?: boolean;                  // default true; false -> noindex
  follow?: boolean;                 // default true
  noarchive?: boolean;
  nosnippet?: boolean;
  noimageindex?: boolean;
  nocache?: boolean;

  // i18n / alternates
  locale?: string;                  // e.g., "en_US", "ko_KR"
  hrefLangs?: Array<{ lang: string; url: URLString }>;

  // Extras
  keywords?: string[];

  // Structured data: page entities
  faq?: FaqItem[];                  // supports speakable items

  /** Optional: supply custom breadcrumbs; otherwise component derives from URL. */
  breadcrumbs?: BreadcrumbItem[];

  /** Optional quick toggle for the UI breadcrumb. */
  showBreadcrumb?: boolean;

  listItems?: Array<{ url: URLString; name: string }>;

  // Media (mapped from canonical watch/listen docs or inline meta)
  video?: VideoMeta;
  audio?: AudioMeta;

  serviceOffers?: Array<{
    name?: string;    
    priceKey: string; // pricing key from src/config/pricing.ts
    buyNowLink?: URLString; // optional buy now / CTA link
  }>;
}
