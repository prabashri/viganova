// src/config/localBusiness.ts
import type { LocalBusinessConfig } from "@/types/localBusiness";
import { siteDefaults } from "@/config/siteDefaults";
import { PRICES_LAST_UPDATED, PRICES } from "@/config/pricing";
import type { PriceKey } from "@/config/pricing";

/* Helpers */
const siteBase = (siteDefaults.siteUrl || "").replace(/\/$/, "");
function collectSameAs(): string[] {
  const s = siteDefaults.socialLinks || {};
  const links = Object.values(s).filter((v): v is string => typeof v === "string" && /^https?:\/\//i.test(v));
  if (typeof s?.x === "string") links.push(`https://x.com/${s.x.replace(/^@/, "")}`);
  return Array.from(new Set(links));
}
function svc(key: PriceKey, url: string) {
  const p = PRICES[key];
  return { name: p.name, url, priceKey: key };
}

/* Brand / contacts (VerifiedApostille defaults) */
const BRAND_NAME = siteDefaults.siteName || "VerifiedApostille";
const BRAND_URL  = siteDefaults.siteUrl || "https://verifiedapostille.com/";
const BRAND_SAME_AS = collectSameAs();

const CONTACT_EMAIL    = siteDefaults.contact?.email    || "contact@verifiedapostille.com";
const CONTACT_PHONE    = siteDefaults.contact?.phone    || "+919047433266";
const CONTACT_WHATSAPP = siteDefaults.contact?.whatsapp || "919047433266";

const BRAND_ADDR = siteDefaults.address;
const BRAND_MAP  = BRAND_ADDR?.googleMap || siteDefaults.parentOrganization?.address?.googleMap || "";

/* Parent org */
const PARENT = siteDefaults.parentOrganization || {};
const PARENT_LEGAL_NAME = PARENT.legalName || PARENT.name || "NViews Media Private Limited";

const LANGUAGES = ["en", "ta", "hi", "ml"];

export const localBusiness: LocalBusinessConfig = {
  enabled: true,
  schemaType: "ProfessionalService",
  businessMode: "online",

  businessUnit: {
    name: BRAND_NAME,
    url: BRAND_URL,
    logo: `${siteBase}/logos/desktop-logo-175w.png`,
    sameAs: BRAND_SAME_AS
  },

  parentOrganization: {
    name: PARENT_LEGAL_NAME,
    url: PARENT.url || "https://thenviews.com/",
    id: (PARENT.url || "https://thenviews.com/").replace(/\/$/, "") + "#organization",
    logo: PARENT.logo
  },

  /* Global defaults (GLOBAL SITE) */
  online: {
    serviceUrl: `${siteBase}/services/`,
    bookingUrl: `${siteBase}/contact-us/`,
    servicePhone: CONTACT_PHONE,
    serviceEmail: CONTACT_EMAIL,
    whatsapp: CONTACT_WHATSAPP,
    availableLanguage: LANGUAGES,
    contactType: "customer support",
    areaServed: ["Worldwide"]          // ⬅️ global
  },

  primaryCategory: "Document authentication service",
  additionalCategories: ["Apostille services","Attestation services","Visa consultant","Notary public"],

  // ⬇️ Routes mapped to verifiedapostille.com structure (/service/*)
  services: [
    svc("meaApostille",       "/service/business-document-apostille/"),
    svc("degreeSdmBundle",    "/service/degree-certificate-apostille/"),
    svc("marksheetSdmBundle", "/service/marksheets-apostille/"),
    svc("marriageSdmBundle",  "/service/marriage-certificate-apostille/"),
    svc("birthSdmBundle",     "/service/birth-certificate-apostille/"),
    svc("pccMeaApostille",    "/service/pcc-apostille/"),
    // you can add more mappings if you have price keys for them:
    // svc("affidavitBundle", "/service/affidavit-apostille/"),
    // svc("personalDocsBundle", "/service/personal-documents-apostille/"),
    // svc("transferCertBundle", "/service/transfer-certificate-apostille/"),
  ],

  priceRange: "₹₹",
  currenciesAccepted: "INR, USD",      // ⬅️ accept both; primary pricing can still display INR
  paymentAccepted: ["Credit Card", "Debit Card", "Net Banking", "UPI", "Wire Transfer"],

  availableLanguage: LANGUAGES,
  areaServed: ["Worldwide"],            // ⬅️ global

  legalName: PARENT_LEGAL_NAME,
  taxId: PARENT.taxId || PARENT.vatId || "",
  foundingDate: PARENT.foundingDate || "2020-01-01",
  registrationId: PARENT.registrationId,

  googleBusinessProfile: { placeId: "", listingUrl: "", reviewsUrl: "" },

  openingHours: [
    { dayOfWeek: "Monday",    opens: "09:30", closes: "19:00" },
    { dayOfWeek: "Tuesday",   opens: "09:30", closes: "19:00" },
    { dayOfWeek: "Wednesday", opens: "09:30", closes: "19:00" },
    { dayOfWeek: "Thursday",  opens: "09:30", closes: "19:00" },
    { dayOfWeek: "Friday",    opens: "09:30", closes: "19:00" },
    { dayOfWeek: "Saturday",  opens: "10:00", closes: "17:00" },
    { dayOfWeek: "Sunday",    closed: true }
  ],

  /* Locations:
     - Keep an online “India” node (service-area) for clarity in schema.
     - Optionally include HQ physical address if you want it visible on verifiedapostille.com.
  */
  locations: [
    {
      "@idSuffix": "india",
      name: "VerifiedApostille (Online Service — India)",
      mode: "serviceArea",
      serviceArea: ["India"],
      openingHours: null,
      online: {
        serviceUrl: `${siteBase}/services/`,
        bookingUrl: `${siteBase}/contact-us/`,
        servicePhone: CONTACT_PHONE,
        serviceEmail: CONTACT_EMAIL,
        whatsapp: CONTACT_WHATSAPP,
        availableLanguage: LANGUAGES,
        contactType: "customer support"
      }
    },

    ...(BRAND_ADDR ? [{
      "@idSuffix": "hq",
      name: "VerifiedApostille — Headquarters",
      mode: "physical" as const,
      address: {
        streetAddress: BRAND_ADDR.streetAddress,
        addressLocality: BRAND_ADDR.addressLocality,
        addressRegion: BRAND_ADDR.addressRegion,
        postalCode: BRAND_ADDR.postalCode,
        addressCountry: BRAND_ADDR.addressCountryCode || BRAND_ADDR.addressCountry
      },
      hasMap: BRAND_MAP || undefined,
      openingHours: null
    }] : [])
  ],

  pricesLastUpdated: PRICES_LAST_UPDATED
};
