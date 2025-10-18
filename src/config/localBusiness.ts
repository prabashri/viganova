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

/* Brand / contacts */
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
    logo: "",
    sameAs: BRAND_SAME_AS
  },

  parentOrganization: {
    name: PARENT_LEGAL_NAME,
    url: PARENT.url || "https://thenviews.com/",
    id: (PARENT.url || "https://thenviews.com/").replace(/\/$/, "") + "#organization",
    logo: PARENT.logo
  },

  /* Global defaults */
  online: {
    serviceUrl: `${siteBase}/services/`,
    bookingUrl: `${siteBase}/contact/`,
    servicePhone: CONTACT_PHONE,
    serviceEmail: CONTACT_EMAIL,
    whatsapp: CONTACT_WHATSAPP,
    availableLanguage: LANGUAGES,
    contactType: "customer support",
    areaServed: ["India"]
  },

  primaryCategory: "Document authentication service",
  additionalCategories: ["Apostille services","Attestation services","Visa consultant","Notary public"],

  services: [
    svc("meaApostille",       "/services/apostille-india/"),
    svc("degreeSdmBundle",    "/services/degree-certificate-apostille/"),
    svc("marksheetSdmBundle", "/services/marksheet-apostille/"),
    svc("marriageSdmBundle",  "/services/marriage-certificate-apostille/"),
    svc("birthSdmBundle",     "/services/birth-certificate-apostille/"),
    svc("pccMeaApostille",    "/services/pcc-apostille/"),
    svc("meaApostille",       "/services/business-document-apostille/")
  ],

  priceRange: "₹₹",
  currenciesAccepted: "INR",
  paymentAccepted: ["UPI", "Credit Card", "Debit Card", "Net Banking"],
  availableLanguage: LANGUAGES,
  areaServed: ["India"],

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

  /* Only enter what's needed per location */
  locations: [
    // ✅ ONLINE/SERVICE-AREA NODE: just channel info (no address)
    {
      "@idSuffix": "india",
      name: "VerifiedApostille (Online Service — India)",
      mode: "serviceArea",
      serviceArea: ["India"],
      openingHours: null,
      online: {
        serviceUrl: `${siteBase}/order/`,
        bookingUrl: `${siteBase}/contact/`,
        servicePhone: CONTACT_PHONE,
        serviceEmail: CONTACT_EMAIL,
        whatsapp: CONTACT_WHATSAPP,
        availableLanguage: LANGUAGES,
        contactType: "customer support"
      }
      // serviceChannels: { online: { ... } } // optional named variant(s)
    },

    // ✅ PHYSICAL NODE: just give address (channels optional)
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
      // online / serviceChannels optional for bookings
    }] : [])
  ],

  pricesLastUpdated: PRICES_LAST_UPDATED
};
