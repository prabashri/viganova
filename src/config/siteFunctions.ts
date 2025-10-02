// src/config/siteFunctions.ts
export const siteFunctions = {

    contactFormHandler: "https://nviewsweb-email-handler.nviews.workers.dev/", // external worker url
    turnstileSitekey: "", // to use Turnstile for form validation
    analyticsId: "", // google analytics id   
    ahrefAnalyticsId: "", 
    cloudflareAnalyticsId: "", 
    bingAPIKey: "", // Bing API key for search
    rss: true, // enable RSS feed globally
    index: false, // enable index page
    mailHandler: "https://nviewsweb-email-handler.nviews.workers.dev/", // external worker url for email handling
    cspReportHandler: "https://csp-report-handler.nviews.workers.dev/", // external worker url for CSP reports
    features: {
        responsive: true,
        typography: true,
        layout: true, 
    },
    // siteFunctions.dateFormat (or siteDefaults.dateFormat)
    // Use this as the single source of truth for ALL date rendering.
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