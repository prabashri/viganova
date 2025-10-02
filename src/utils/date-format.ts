// src/utils/date-format.ts
import { siteFunctions } from '@/config/siteFunctions';
import { siteDefaults } from '@/config/siteDefaults';

export type OnInvalid =
  | 'blank'
  | 'undefined'
  | 'now'
  | { use: string };

export type MachineKind = 'iso' | 'date' | 'datetime' | 'epoch';

type DFOptions = {
  locale?: string;
  timeZone?: string;
  timeZoneName?: 'short' | 'long' | 'shortOffset' | 'longOffset' | 'shortGeneric' | 'longGeneric';
  weekday?: 'long' | 'short' | 'narrow';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  /** Recognized tokens: weekday, month, day, year, tz (case-insensitive) */
  pattern?: string;    // e.g. 'weekday, month day, year tz'
  machine?: MachineKind;
};

type DateConfig = { dateFormat?: DFOptions };

/* ---------------- Config with safe defaults ---------------- */
function getCfg(): Required<DFOptions> {
  const base =
    ((siteFunctions as unknown as DateConfig)?.dateFormat ??
     (siteDefaults  as unknown as DateConfig)?.dateFormat) || {};
  return {
    locale: base.locale ?? 'en-US',
    timeZone: base.timeZone ?? 'UTC',
    timeZoneName: base.timeZoneName ?? undefined,
    weekday: base.weekday ?? undefined,
    year: base.year ?? 'numeric',
    month: base.month ?? 'short',
    day: base.day ?? 'numeric',
    pattern: base.pattern ?? '',
    machine: base.machine ?? 'iso',
  } as Required<DFOptions>;
}

function machineKind(): MachineKind {
  return getCfg().machine ?? 'iso';
}

/* ---------------- Robust, lightweight parsing ---------------- */
const MONTHS: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  const longs = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const shorts = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  longs.forEach((m, i) => (map[m] = i + 1));
  shorts.forEach((m, i) => (map[m] = i + 1));
  return map;
})();
const RE_YMD     = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/;                        // 2025-09-10 | 2025-09 | 2025
const RE_MON_D_Y = /^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,)?\s+(\d{4})$/;      // Sep 01, 2025
const RE_D_MON_Y = /^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(?:,?\s*)?(\d{4})$/;  // 2 September 2025

function parseDate(input?: string | number | Date): Date | undefined {
  if (input == null) return undefined;
  if (input instanceof Date) return isNaN(input.getTime()) ? undefined : input;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const s = String(input).trim();
  if (!s) return undefined;

  // ISO/RFC/offset
  if (/^\d{4}-\d{2}-\d{2}T/.test(s) || /Z$|[+-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }
  // YYYY-MM(-DD)
  {
    const m = RE_YMD.exec(s);
    if (m) {
      const y = +m[1], mo = +(m[2] ?? 1), da = +(m[3] ?? 1);
      const d = new Date(Date.UTC(y, mo - 1, da));
      return isNaN(d.getTime()) ? undefined : d;
    }
  }
  // Sep 01, 2025
  {
    const m = RE_MON_D_Y.exec(s);
    if (m) {
      const mon = MONTHS[m[1].toLowerCase()], day = +m[2], year = +m[3];
      if (mon) {
        const d = new Date(Date.UTC(year, mon - 1, day));
        return isNaN(d.getTime()) ? undefined : d;
      }
    }
  }
  // 2 September 2025
  {
    const m = RE_D_MON_Y.exec(s);
    if (m) {
      const day = +m[1], mon = MONTHS[m[2].toLowerCase()], year = +m[3];
      if (mon) {
        const d = new Date(Date.UTC(year, mon - 1, day));
        return isNaN(d.getTime()) ? undefined : d;
      }
    }
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function onInvalidResult(mode: OnInvalid): string | undefined {
  if (mode === 'undefined') return undefined;
  if (mode === 'now') return new Date().toISOString();
  if (typeof mode === 'object' && mode?.use) return mode.use;
  return ''; // blank
}

/* ---------------- Intl formatter cache ---------------- */
const fmtCache = new Map<string, Intl.DateTimeFormat>();
const OPT_KEYS = ['timeZone','timeZoneName','weekday','year','month','day'] as const;

function fmtKey(locale: string, opts: Intl.DateTimeFormatOptions) {
  // Stable key: known option keys in fixed order
  const parts = OPT_KEYS.map(k => `${k}:${(opts as any)[k] ?? ''}`).join('|');
  return `${locale}|${parts}`;
}
function getFormatter(locale: string, opts: Intl.DateTimeFormatOptions) {
  const key = fmtKey(locale, opts);
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opts);
    fmtCache.set(key, f);
  }
  return f;
}

/* ---------------- Human formatting ---------------- */
function humanParts(d: Date) {
  const { locale, timeZone, weekday, year, month, day, timeZoneName } = getCfg();
  const opts: Intl.DateTimeFormatOptions = { timeZone, timeZoneName, weekday, year, month, day };
  const fmt = getFormatter(locale, opts);
  const parts = fmt.formatToParts(d);
  const pick = (t: string) => parts.find(p => p.type === t)?.value;

  return {
    weekday: pick('weekday'),
    month: pick('month'),
    day: pick('day'),
    year: pick('year'),
    tz: pick('timeZoneName'),
    format: () => fmt.format(d), // for default layout
  };
}

function formatWithLayout(d: Date, pattern?: string): string {
  const cfg = getCfg();
  const hp = humanParts(d);
  if (!pattern) return hp.format();

  let out = pattern;
  const rep = (token: string, val?: string) => {
    out = out.replace(new RegExp(`\\b${token}\\b`, 'gi'), () => (val ?? ''));
  };
  rep('weekday', hp.weekday);
  rep('month',   hp.month);
  rep('day',     hp.day);
  rep('year',    hp.year);
  rep('tz',      hp.tz);

  return out.replace(/\s+,/g, ',').replace(/,\s*,/g, ', ').replace(/\s{2,}/g, ' ').trim();
}

/* ---------------- Public API ---------------- */
export function toISO(input?: string | number | Date, onInvalid: OnInvalid = 'blank'): string | undefined {
  const d = parseDate(input);
  if (!d) return onInvalidResult(onInvalid);
  switch (machineKind()) {
    case 'date':     return d.toISOString().slice(0, 10);        // YYYY-MM-DD
    case 'datetime': return d.toISOString().replace(/Z$/, '');   // YYYY-MM-DDTHH:mm:ss.mmm
    case 'epoch':    return String(d.getTime());                 // ms since epoch
    case 'iso':
    default:         return d.toISOString();                     // UTC ISO
  }
}

export function toHuman(input?: string | number | Date, onInvalid: OnInvalid = 'blank'): string | undefined {
  const d = parseDate(input);
  if (!d) {
    const fb = onInvalidResult(onInvalid);
    if (fb && /^\d{4}-\d{2}-\d{2}T/.test(fb)) return toHuman(fb, 'blank');
    return fb;
  }
  try {
    const { pattern } = getCfg();
    return formatWithLayout(d, pattern);
  } catch {
    const { locale, timeZone } = getCfg();
    // ultra-safe fallback (uncached single call is fine here)
    return new Intl.DateTimeFormat(locale, { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  }
}

export function machineAndHuman(
  input?: string | number | Date,
  onInvalid: OnInvalid = 'blank'
): { iso?: string; human?: string } {
  return { iso: toISO(input, onInvalid), human: toHuman(input, onInvalid) };
}

// Aliases
export const toMachineDate = toISO;
export const toIso = toISO;
export const toHumanDate = toHuman;
