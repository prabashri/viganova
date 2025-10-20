// src/config/siteFunctions.ts
export const siteFunctions = {

    contactFormHandler: "https://nviewsweb-email-handler.nviews.workers.dev/", // external worker url
    /* CAPTCHA KEYS (for forms, comments, etc.) -------------------------- */
    turnstileEnabled: true,
    turnstileSitekey: "0x4AAAAAAB5d0h3hP88waWBq", // https://dash.cloudflare.com/1caa5b7ce96dd93ff08ae0e8cde90b72/turnstile/add
    turnstileSitekeyTest: "1x00000000000000000000AA", // test key, always passes
    turnstileSecretTest: "1x0000000000000000000000000000000AA", // https://dash.cloudflare.com/1caa5b7ce96dd93ff08ae0e8cde90b72/turnstile/add
    /** google adsense account */
    enableAdSense: true,
    adsense: "ca-pub-8380181212468292",

    enableOtherAds: false, // e.g., Ezoic, Media.net, etc.


    googleAnalytics: true, // enable Google Analytics
    analyticsId: "G-6KCKPN2GF6", // google analytics id   
    /* by default google analytics used if id provided*/
    googleTag: false, // enable Google Tag Manager
    googleTagId: "GTM-K9NQ9CBL", // google tag manager id
    
    ahrefAnalytics: false, // enable Ahrefs Analytics
    ahrefAnalyticsId: "", 
    
    cloudflareAnalytics: false, // enable Cloudflare Web Analytics
    cloudflareAnalyticsId: "4be9b10a675a4f35bf2dcf007478da91", 
     /* Cloudflare RUM (auto /cdn-cgi/rum) */
    enableCloudflareRUM: true,   // ← new flag
    
    bingAPIKey: "", // Bing API key for search
    rss: true, // enable RSS feed globally
    index: true, // enable index page


    // ✅ NEW: Consent settings
    consent: {
      enabled: true,                 // if false => NO consent mode, NO banner
      cookieName: "consent.v1",
      // keep both for compatibility; JS will prefer cookieDuration if present
      cookieDuration: 180,           // days (alias)
      ttlDays: 180,                  // days
      autograntMs: 120000,           // auto-accept timer (ms). Ignored in EU if euOnly=true
      preConsentPageview: true,      // allow cookieless PV, then green-flag analytics/ad storage until user chooses
      euOnly: true,                  // if true, no autogrant in EU/UK
      version: "1",                  // bump to force re-consent
      position: "center",            // 'center' | 'bottomCentered' | 'bottomLeft' | 'bottomRight'
      // Defaults applied on autogrant or first-load when preConsentPageview=true
      defaults: {
        analytics: true,
        ads: true,
        personalized: false
      },

      // Optional privacy hardening for GA/GTM
      privacy: {
        urlPassthrough: true,
        adsDataRedaction: true,
        developerId: "116822047451919185236"              // e.g. "d-XXXXXXXX"
      },

      // Optional UI copy / links (banner reads this if you show it)
      policyUrl: "/privacy-policy/"
    },

    mailHandler: "https://nviewsweb-email-handler.nviews.workers.dev/", // external worker url for email handling
    cspReportHandler: "https://csp-report-handler.nviews.workers.dev/", // external worker url for CSP reports
    features: {
        responsive: true,
        typography: true,
        layout: true, 
    },
    // siteFunctions.dateFormat (or siteDefaults.dateFormat)
    // Use this as the single source of truth for ALL date rendering.
    robots:{
      disallow: [
        '/admin/', 
        '/api/'
      ], // paths to disallow in production
      blockAllInNonProd: true, // block all in non-production (disallow: /)
      sitemapUrl: 'sitemap.xml', // relative path to sitemap
      // Optional HTTP headers (for non-Astro routes)
      blockAICrawlers: false, // ← flip to false to allow AI bots + remove headers
    },
    dateFormat: {
        /* Locale & Timezone ---------------------------------------------- */
        locale: 'en-US',              // e.g. 'en-GB', 'ko-KR', 'ta-IN'
        timeZone: 'Asia/Kolkata',     // e.g. 'Asia/Seoul', 'UTC', 'Europe/Berlin'

        /* Which labels to show (Intl options) ----------------------------- */
        // Remove (set to undefined) any field you don't want to display.
        timeZoneName: 'short',        // 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric' | undefined
        weekday: 'short',              // 'long' | 'short' | 'narrow' | undefined
        year: 'numeric',              // 'numeric' | '2-digit' | undefined
        month: 'short',                // 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' | undefined
        day: 'numeric',               // 'numeric' | '2-digit' | undefined

        /* Output layout (simple tokens) ----------------------------------- */
        // Use tokens: weekday | month | day | year | tz (case-insensitive).
        // If you set this to '' (empty), the util will use Intl’s default
        // format per the options above.
        pattern: 'month day, year',
        // Examples:
        // 'month day, year'               → “September 12, 2025”
        // 'day month, year'               → “12 September, 2025”   (use en-GB or set month:'long')
        // 'weekday, day month, year tz'   → “Friday, 12 September, 2025 IST”
        // 'year-month-day'                → “2025-09-12” (set month:'2-digit', day:'2-digit')

        /* Machine format for <time datetime="..."> ------------------------ */
        machine: 'iso',               // 'iso' | 'date' | 'datetime' | 'epoch'
    },
    /* ───────────────────────── CDN CONFIG ─────────────────────────
        Leave cdnUrl/cdnPath empty ("") to disable CDN rewriting.
        utils/urls.ts will first use cdnUrl, then cdnPath, else do nothing.
    ---------------------------------------------------------------- */
    /** Preferred full CDN origin, e.g. "https://nviews-b-cdn.net" */
    cdnUrl: '',// 'https://nviews-b-cdn.net',
    /** Optional alternate base (legacy). Also treated as a full origin. */
    cdnPath: '',
    /** Which top-level folders should be CDN-ized when cdn:'auto' */
    cdnAssets: [
        'images',
        'videos',
        'audio',
        'css',
        'js',
        'documents',
        'fonts',
        'static',
    ] as CdnAssetRoot[],

    allowGoogleFonts: true, // set to false to block Google Fonts (in CSP and elsewhere)
    enableYouTube: true,             // adds media-src/frame-src for YouTube
    enableVimeo: false,              // adds media-src/frame-src for Vimeo (only if you use it)
    enableProductHunt: false,        // adds api.producthunt.com + producthunt.com (images/embeds)
    allowGravatar: true,             // adds www.gravatar.com to img-src

} as const;
export type CdnAssetRoot =
  | 'images'
  | 'videos'
  | 'audio'
  | 'css'
  | 'js'
  | 'documents'
  | 'fonts'
  | 'static';

  /* Optional helpers (used by utils or anywhere else) */
export const getCdnBase = () =>
  (siteFunctions.cdnUrl || siteFunctions.cdnPath || '').trim().replace(/\/+$/, '');

export const getCdnAssets = () =>
  (siteFunctions.cdnAssets ?? []).map(s => String(s).replace(/^\/|\/$/g, '')) as CdnAssetRoot[];