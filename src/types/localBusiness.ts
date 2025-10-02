// NEW: allowable schema.org local-business types (open set)
export type LocalBusinessSchemaType =
  | "LocalBusiness"
  | "ProfessionalService"
  | "LegalService"
  | "FinancialService"
  | "Store"
  | string;

export type BusinessMode = "physical" | "serviceArea" | "online";

export interface ServiceChannelInfo {
  serviceUrl?: string;
  bookingUrl?: string;
  servicePhone?: string;
  serviceEmail?: string;
  whatsapp?: string;                // raw; builder will normalize to wa.me
  availableLanguage?: string[];
  contactType?: string;             // e.g., "customer support"
  areaServed?: string[];
}
export type ServiceChannels = Record<string, ServiceChannelInfo>;

export type IsoCountryCode = "IN" | "KR" | "US" | "AE" | string;

export type DayOfWeek =
  | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface BusinessAddress {
  streetAddress: string;
  addressLocality: string;  // city
  addressRegion: string;    // state/province
  postalCode: string;
  addressCountry: IsoCountryCode;
}

export interface GeoCoordinates { latitude: number; longitude: number; }

export interface OpeningHour {
  dayOfWeek: DayOfWeek;
  opens?: string;   // "HH:MM" 24h
  closes?: string;  // "HH:MM" 24h
  closed?: boolean; // true → ignore opens/closes
}

export interface GBPLinks {
  placeId?: string;
  listingUrl?: string;
  reviewsUrl?: string;
}

export interface ServiceLink {
  name: string;
  url: string;
  /** Pricing key from src/config/pricing.ts (e.g., "sdmBundle", "meaApostille") */
  priceKey?: string;
}

/* ---------- Discriminated union so you only enter what’s needed ---------- */

interface LocationBase {
  /** Suffix for a stable @id like <site>/#localbusiness-thanjavur */
  "@idSuffix": string;
  /** Location/branch display name */
  name: string;

  /** Optional: override node type/category */
  schemaType?: LocalBusinessSchemaType;
  category?: string;

  // contacts (optional on both)
  telephone?: string;
  whatsapp?: string;
  email?: string;

  image?: string;     // poster image for branch
  openingHours?: OpeningHour[] | null;
  serviceArea?: string[];
  hasMap?: string;
}

/** Physical branch MUST provide address; geo optional */
export interface PhysicalLocationEntry extends LocationBase {
  mode: "physical";
  address: BusinessAddress;       // required
  geo?: GeoCoordinates;
  /** optional channels for booking etc. */
  online?: ServiceChannelInfo;    // legacy single
  serviceChannels?: ServiceChannels;
}

/** Virtual/online/service-area MUST provide some channel info */
export interface VirtualLocationEntry extends LocationBase {
  mode: "online" | "serviceArea";
  // explicitly forbid physical address on virtual nodes
  address?: never;
  geo?: never;
  /** at least one of these should exist */
  online?: ServiceChannelInfo;    // legacy single
  serviceChannels?: ServiceChannels;
}

export type LocationEntry = PhysicalLocationEntry | VirtualLocationEntry;

export interface ParentOrganizationRef {
  name: string;
  url: string;
  id?: string;
  logo?: string;
}

export interface LocalBusinessConfig {
  enabled: boolean;
  businessMode?: BusinessMode;            // default for branches
  schemaType?: LocalBusinessSchemaType;

  businessUnit: {
    name: string;
    url: string;
    logo?: string;
    sameAs?: string[];
  };

  parentOrganization: ParentOrganizationRef;

  primaryCategory: string;
  additionalCategories?: string[];

  services: ServiceLink[];

  priceRange?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string[] | string;

  availableLanguage?: string[];
  areaServed?: string[];

  legalName?: string;
  gstNumber?: string;
  foundingDate?: string;
  registrationId?: string;
  vatId?: string;
  taxId?: string;

  googleBusinessProfile?: GBPLinks;

  openingHours?: OpeningHour[];

  /** Global online defaults (used if a location doesn’t override) */
  online?: ServiceChannelInfo;
  /** Also allow global named channels (optional) */
  serviceChannels?: ServiceChannels;

  locations: LocationEntry[];
  pricesLastUpdated: string;
}
