// src/config/siteFunctions.ts
export const siteFunctions = {
    contactFormHandler: "https://nviewsweb-email-handler.nviews.workers.dev/", // external worker url
    turnstileSitekey: "", // to use Turnstile for form validation
    analyticsId: "", // google analytics id    
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
    }
};
