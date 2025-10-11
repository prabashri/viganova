// src/config/pricing.ts
export const PRICES_LAST_UPDATED = "2025-09-28";

export type CurrencyCode = "INR";

export type PriceInfo = {
  amount: number;
  name: string;
  buyNowLink?: string;
  currency?: CurrencyCode;
};

export const PRICES = {
  /* Bundles */
  sdmBundle: {
    amount: 2000,
    name: "Standard SDM–MEA Apostille",
    buyNowLink: "https://razorpay.me/cXdertde09",
    currency: "INR",
  },

  birthSdmBundle: {
    amount: 2000,
    name: "Birth Certificate — SDM–MEA Apostille",
  },

  marriageSdmBundle: {
    amount: 2000,
    name: "Marriage Certificate — SDM–MEA Apostille",
  },

  degreeSdmBundle: {
    amount: 2000,
    name: "Degree Certificate — SDM–MEA Apostille",
  },

  marksheetSdmBundle: {
    amount: 2000,
    name: "Marksheet — SDM–MEA Apostille",
  },

  /* MEA-only handling */
  meaApostille: {
    amount: 450,
    name: "MEA Apostille — Handling Only",
  },

  meaAttestation: {
    amount: 450,
    name: "MEA Attestation — Handling Only",
  },

  pccRpoMeaApostille: {
    amount: 1000,
    name: "PCC RPO — MEA Apostille Handling",
  },

  pccMeaApostille: {
    amount: 2000,
    name: "PCC — MEA Apostille Handling",
  },

  /* Common add-ons */
  pickupReturn: {
    amount: 1100,
    name: "Pickup & Return (Nationwide)",
  },

  notary: {
    amount: 160,
    name: "Notary",
  },

  cocPerPage: {
    amount: 450,
    name: "Chamber of Commerce (per page)",
  },
} as const satisfies Record<string, PriceInfo>;

export type PriceKey = keyof typeof PRICES;

export const inr = (n: number) =>
  n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

/** Raw amount (number, e.g., 2000) */
export const price = (k: PriceKey): number => (PRICES[k] as PriceInfo).amount;

/** Full info with currency defaulted to INR; buyNowLink remains optional */
export type PriceInfoFull = Omit<PriceInfo, "currency"> & { currency: CurrencyCode };

export const priceInfo = (k: PriceKey): PriceInfoFull => {
  const p = PRICES[k] as PriceInfo;
  return {
    amount: p.amount,
    name: p.name,
    buyNowLink: p.buyNowLink,     // optional as intended
    currency: p.currency ?? "INR" // default
  };
};

/** Convenience label for UI */
export const priceLabel = (k: PriceKey): string =>
  `${(PRICES[k] as PriceInfo).name} — ${inr((PRICES[k] as PriceInfo).amount)}`;
