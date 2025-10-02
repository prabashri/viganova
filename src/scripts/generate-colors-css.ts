// src/scripts/generate-colors-css.ts
import fs from 'fs/promises';
import path from 'path';
import { siteColors } from '../config/siteColors';
import { readManifest, writeManifestEntry } from '../utils/write-manifest';

const cssPath = path.resolve('./src/styles/inline/colors.css');
const cssMainPath = path.resolve('./src/styles/main/colors.css');

type DarkAdjustmentMode = 'swap' | 'adjust';

/* -------------------------
   🎨 Helpers
------------------------- */
function clampLightness(l: number, userProvided?: boolean): number {
  if (userProvided) return Math.round(l);
  return Math.min(Math.max(Math.round(l), 5), 95);
}

function normalizeHsla(h: number, s: number, l: number, a?: number, userProvided?: boolean) {
  return {
    h: Math.round(h),
    s: Math.round(s),
    l: clampLightness(l, userProvided),
    a: a !== undefined ? +(a.toFixed(2)) : 1
  };
}

function hslaToCss(hsla: { h: number, s: number, l: number, a?: number }) {
  const alpha = hsla.a !== undefined ? hsla.a : 1;
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${alpha})`;
}

function parseColorToHSLA(color: string, userProvided = true): { h: number, s: number, l: number, a?: number } {
  if (!color) throw new Error(`Empty color cannot be parsed`);
  color = color.trim().toLowerCase();

  const adjustIfExtreme = (obj: { h: number, s: number, l: number, a?: number }) => {
    if (!userProvided) {
      if (obj.l === 100) obj.l = 95;
      if (obj.l === 0) obj.l = 5;
    }
    return obj;
  };

  if (color.startsWith('#')) {
    let hex = color.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : undefined;
      return adjustIfExtreme(rgbToHsla(r, g, b, a));
    }
  }

  if (color.startsWith('rgb')) {
    const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return adjustIfExtreme(rgbToHsla(values[0], values[1], values[2], values[3]));
  }

  if (color.startsWith('hsl')) {
    const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return adjustIfExtreme(normalizeHsla(values[0], values[1], values[2], values[3], userProvided));
  }

  throw new Error(`Unsupported color format: ${color}`);
}

function rgbToHsla(r: number, g: number, b: number, a?: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return normalizeHsla(h * 360, s * 100, l * 100, a);
}

/* -------------------------
   🔄 Shade Generator (Exact 7 Keys)
------------------------- */
type ShadeKey =
  | 'darker-x'
  | 'darker'
  | 'dark'
  | 'base'
  | 'light'
  | 'lighter'
  | 'lighter-x';

function generateColorSet(baseColor: string, userValues: Record<ShadeKey, string>) {
  const baseHSLA = parseColorToHSLA(baseColor, true);

  const shadeAdjustments: Record<ShadeKey, number> = {
    'darker-x': -35,
    'darker': -25,
    'dark': -10,
    'base': 0,
    'light': 10,
    'lighter': 20,
    'lighter-x': 30
  };

  const shades: Record<ShadeKey, string> = {} as any;

  (Object.keys(shadeAdjustments) as ShadeKey[]).forEach(key => {
    if (userValues[key] && userValues[key].trim() !== '') {
      shades[key] = hslaToCss(parseColorToHSLA(userValues[key], true));
    } else {
      const adjL = clampLightness(baseHSLA.l + shadeAdjustments[key], false);
      shades[key] = hslaToCss({ ...baseHSLA, l: adjL, a: 1 });
    }
  });

  return shades;
}

/* -------------------------
   ⚪ Base Scale
------------------------- */
function generateBaseScale(reverse = false) {
  const base: Record<string, string> = {};
  const steps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];

  for (let step of steps) {
    const val = reverse ? step : 100 - step;
    const key = step === 100 ? 'base-100' : `base-${step.toString().padStart(2, '0')}`;
    base[key] = `hsla(0, 0%, ${val}%, 1)`;
  }

  return base;
}

function generateDarkModeShades(
  lightShades: Record<ShadeKey, string>
): Record<ShadeKey, string> {
  const adjusted: Record<ShadeKey, string> = {} as any;

  const shadeSwapMap: Record<ShadeKey, ShadeKey> = {
    'darker-x': 'lighter-x',
    'darker': 'lighter',
    'dark': 'light',
    'base': 'base',
    'light': 'dark',
    'lighter': 'darker',
    'lighter-x': 'darker-x'
  };

  if (siteColors.darkAdjustmentMode === 'swap') {
    (Object.keys(shadeSwapMap) as ShadeKey[]).forEach(key => {
      adjusted[key] = lightShades[shadeSwapMap[key]];
    });
  } else {
    (Object.keys(lightShades) as ShadeKey[]).forEach(key => {
      const hsla = parseColorToHSLA(lightShades[key], false);
      const newL = clampLightness(hsla.l + 5);
      const newS = Math.max(0, Math.min(100, hsla.s - 10));
      adjusted[key] = hslaToCss({ ...hsla, l: newL, s: newS });
    });
  }

  return adjusted;
}

function generateCSS(colors: typeof siteColors) {
  // --- Light mode brand sets
  const primaryShades = generateColorSet(colors.primaryColor, {
    'darker-x': colors.primaryColorDarkerX,
    'darker':   colors.primaryColorDarker,
    'dark':     colors.primaryColorDark,
    'base':     colors.primaryColor,
    'light':    colors.primaryColorLight,
    'lighter':  colors.primaryColorLighter,
    'lighter-x':colors.primaryColorLighterX
  });

  const secondaryShades = generateColorSet(colors.secondaryColor, {
    'darker-x': colors.secondaryColorDarkerX,
    'darker':   colors.secondaryColorDarker,
    'dark':     colors.secondaryColorDark,
    'base':     colors.secondaryColor,
    'light':    colors.secondaryColorLight,
    'lighter':  colors.secondaryColorLighter,
    'lighter-x':colors.secondaryColorLighterX
  });

  const baseLight = generateBaseScale(false);
  const baseDark  = colors.darkBase === false ? baseLight : generateBaseScale(true);

  const bgLightHSLA   = parseColorToHSLA(colors.backgroundColor, true);
  const textLightHSLA = parseColorToHSLA(colors.textColor, true);
  const bgDarkHSLA    = parseColorToHSLA(colors.darkBackgroundColor, true);
  const textDarkHSLA  = parseColorToHSLA(colors.darkTextColor, true);

  const anyDarkPrimaryProvided =
    !!(colors.darkPrimaryColor?.trim() ||
       colors.darkPrimaryColorDarkerX?.trim() ||
       colors.darkPrimaryColorDarker?.trim() ||
       colors.darkPrimaryColorDark?.trim() ||
       colors.darkPrimaryColorLight?.trim() ||
       colors.darkPrimaryColorLighter?.trim() ||
       colors.darkPrimaryColorLighterX?.trim());

  const anyDarkSecondaryProvided =
    !!(colors.darkSecondaryColor?.trim() ||
       colors.darkSecondaryColorDarkerX?.trim() ||
       colors.darkSecondaryColorDarker?.trim() ||
       colors.darkSecondaryColorDark?.trim() ||
       colors.darkSecondaryColorLight?.trim() ||
       colors.darkSecondaryColorLighter?.trim() ||
       colors.darkSecondaryColorLighterX?.trim());

  const primaryDarkShades = anyDarkPrimaryProvided
    ? generateColorSet(colors.darkPrimaryColor || colors.primaryColor, {
        'darker-x': colors.darkPrimaryColorDarkerX,
        'darker':   colors.darkPrimaryColorDarker,
        'dark':     colors.darkPrimaryColorDark,
        'base':     colors.darkPrimaryColor || '',
        'light':    colors.darkPrimaryColorLight,
        'lighter':  colors.darkPrimaryColorLighter,
        'lighter-x':colors.darkPrimaryColorLighterX
      })
    : generateDarkModeShades(primaryShades);

  const secondaryDarkShades = anyDarkSecondaryProvided
    ? generateColorSet(colors.darkSecondaryColor || colors.secondaryColor, {
        'darker-x': colors.darkSecondaryColorDarkerX,
        'darker':   colors.darkSecondaryColorDarker,
        'dark':     colors.darkSecondaryColorDark,
        'base':     colors.darkSecondaryColor || '',
        'light':    colors.darkSecondaryColorLight,
        'lighter':  colors.darkSecondaryColorLighter,
        'lighter-x':colors.darkSecondaryColorLighterX
      })
    : generateDarkModeShades(secondaryShades);

  const darkThemeBlock = siteColors.darkMode ? `
[data-theme="dark"] {
  color-scheme: dark;

  /* Primary Colors (Dark) */
  ${Object.entries(primaryDarkShades).map(([k, v]) => `--primary-${k}: ${v};`).join('\n  ')}

  /* Secondary Colors (Dark) */
  ${Object.entries(secondaryDarkShades).map(([k, v]) => `--secondary-${k}: ${v};`).join('\n  ')}

  /* Background & Text (Dark) */
  --background-color: ${hslaToCss(bgDarkHSLA)};
  --text-color: ${hslaToCss(textDarkHSLA)};

  /* Base Greyscale (Dark) */
  ${Object.entries(baseDark).map(([k, v]) => `--${k}: ${v};`).join('\n  ')}
}` : '';

  return `/* ================================
   🌈 CSS VARIABLES
================================ */
:root {
  color-scheme: light dark;

  /* Primary Colors */
  ${Object.entries(primaryShades).map(([k, v]) => `--primary-${k}: ${v};`).join('\n  ')}

  /* Secondary Colors */
  ${Object.entries(secondaryShades).map(([k, v]) => `--secondary-${k}: ${v};`).join('\n  ')}

  /* Background & Text */
  --background-color: ${hslaToCss(bgLightHSLA)};
  --text-color: ${hslaToCss(textLightHSLA)};

  /* Base Greyscale */
  ${Object.entries(baseLight).map(([k, v]) => `--${k}: ${v};`).join('\n  ')}
}
${darkThemeBlock}`;
}

/* -------------------------
   ✅ Status Defaults Writer (cssMainPath)
   - Respects siteColors if provided
   - Auto-inverts for dark when no explicit dark* provided
   - Replaces only the marked block if present
------------------------- */
const STATUS_BEGIN = '/* STATUS_COLORS:BEGIN (auto-generated) */';
const STATUS_END   = '/* STATUS_COLORS:END */';

type StatusName = 'success' | 'error' | 'alert' | 'note';
type Triplet = { light: string; base: string; dark: string };

const DEFAULT_STATUS: Record<`${StatusName}${'' | 'Light' | 'Dark'}`, string> = {
  // success
  successLight: 'hsla(128, 100%, 82%, 1.00)',
  success:      'hsla(128, 100%, 40%, 1.00)',
  successDark:  'hsla(128, 100%, 20%, 1.00)',
  // note
  noteLight:    'hsla(200, 100%, 70%, 1.00)',
  note:         'hsla(200, 100%, 50%, 1.00)',
  noteDark:     'hsla(220, 100%, 40%, 1.00)',
  // error
  errorLight:   'hsla(0, 100%, 90%, 1.00)',
  error:        'hsla(0, 100%, 40%, 1.00)',
  errorDark:    'hsla(0, 100%, 30%, 1.00)',
  // alert
  alertLight:   'hsla(39, 100%, 85%, 1.00)',
  alert:        'hsla(39, 100%, 50%, 1.00)',
  alertDark:    'hsla(39, 100%, 30%, 1.00)',
};

// Read a single value from siteColors or default
function pick(key: keyof typeof DEFAULT_STATUS): string {
  const v = (siteColors as any)?.[key];
  return (typeof v === 'string' && v.trim()) ? v.trim() : DEFAULT_STATUS[key];
}

// Triplets for :root
function readLightTriplet(name: StatusName): Triplet {
  return {
    light: pick(`${name}Light` as const),
    base:  pick(name as any),
    dark:  pick(`${name}Dark` as const),
  };
}

// Build dark triplet:
// - If siteColors has dark* overrides, use them (with per-token fallback to the light triplet)
// - Else, AUTO-INVERT: swap light <-> dark; keep base unchanged
function readDarkTriplet(name: StatusName, lightTriplet: Triplet): Triplet {
  const cap = name[0].toUpperCase() + name.slice(1);
  const lightKey = `dark${cap}Light`;
  const baseKey  = `dark${cap}`;
  const darkKey  = `dark${cap}Dark`;

  const rawLight = (siteColors as any)?.[lightKey];
  const rawBase  = (siteColors as any)?.[baseKey];
  const rawDark  = (siteColors as any)?.[darkKey];

  const hasAny = [rawLight, rawBase, rawDark].some(v => typeof v === 'string' && v.trim());
  if (hasAny) {
    return {
      light: (typeof rawLight === 'string' && rawLight.trim()) ? rawLight.trim() : lightTriplet.light,
      base:  (typeof rawBase  === 'string' && rawBase.trim())  ? rawBase.trim()  : lightTriplet.base,
      dark:  (typeof rawDark  === 'string' && rawDark.trim())  ? rawDark.trim()  : lightTriplet.dark,
    };
  }

  // Auto-invert fallback: for dark theme, the “light” token should be the darker tone, and “dark” should be the lighter tone.
  return {
    light: lightTriplet.dark, // becomes the darker shade in dark theme
    base:  lightTriplet.base, // unchanged
    dark:  lightTriplet.light // becomes the lighter shade in dark theme
  };
}

function toCssVars(name: StatusName, t: Triplet): string {
  return [
    `--${name}-light: ${t.light};`,
    `--${name}: ${t.base};`,
    `--${name}-dark: ${t.dark};`,
  ].join('\n  ');
}

function buildStatusDefaultsBlock(): string {
  const names: StatusName[] = ['success','error','alert','note'];

  // :root values (light)
  const lightVars = names
    .map(n => toCssVars(n, readLightTriplet(n)))
    .join('\n\n  ');

  // [data-theme="dark"] values (dark* overrides or auto-invert)
  const darkVars = names
    .map(n => {
      const l = readLightTriplet(n);
      const d = readDarkTriplet(n, l);
      return toCssVars(n, d);
    })
    .join('\n\n  ');

  return `${STATUS_BEGIN}
:root {
  /* Status tokens (light) — from siteColors or defaults */
  ${lightVars}
}

[data-theme="dark"] {
  /* Status tokens (dark) — uses siteColors dark* overrides when provided; otherwise auto-inverts light/dark */
  ${darkVars}
}
${STATUS_END}
`;
}


async function ensureStatusDefaultsInCssMain(): Promise<void> {
  const block = buildStatusDefaultsBlock();
  await fs.mkdir(path.dirname(cssMainPath), { recursive: true });

  try {
    const current = await fs.readFile(cssMainPath, 'utf8');
    const beginIdx = current.indexOf(STATUS_BEGIN);
    const endIdx = current.indexOf(STATUS_END);

    if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
      const before = current.slice(0, beginIdx);
      const after = current.slice(endIdx + STATUS_END.length);
      const next = `${before}${block}${after}`.replace(/\n{3,}/g, '\n\n').trim() + '\n';
      await fs.writeFile(cssMainPath, next, 'utf8');
      console.log('✅ status colors block updated in main colors.css');
    } else {
      const sep = current.trim().length ? '\n\n' : '';
      const next = `${current}${sep}${block}`;
      await fs.writeFile(cssMainPath, next, 'utf8');
      console.log('✅ status colors block appended to main colors.css');
    }
  } catch {
    await fs.writeFile(cssMainPath, block, 'utf8');
    console.log('✅ main colors.css created with status colors block');
  }
}

/* -------------------------
   🛠 Change Detector
------------------------- */
async function colorsChangedSinceLastBuild(): Promise<boolean> {
  const manifest = await readManifest();
  const manifestEntry = manifest.css?.colors;

  try {
    const colorsStat = await fs.stat(path.resolve('./src/config/siteColors.ts'));
    if (!manifestEntry?.datetime) return true;

    const manifestTime = new Date(manifestEntry.datetime).getTime();
    const fileTime = colorsStat.mtime.getTime();
    return fileTime > manifestTime;
  } catch {
    return true;
  }
}

/* -------------------------
   🚀 Main
------------------------- */
async function main() {
  // Always ensure defaults in cssMainPath (idempotent, non-destructive outside markers)
  await ensureStatusDefaultsInCssMain();

  const shouldRebuild = await colorsChangedSinceLastBuild();
  if (!shouldRebuild) {
    console.log('ℹ️ colors.css is already up-to-date (no change detected)');
    return;
  }

  const cssContent = generateCSS(siteColors);
  await fs.writeFile(cssPath, cssContent, 'utf8');
  console.log('✅ colors.css updated');

  const normalizedPath = '/' + path.relative(process.cwd(), cssPath).replace(/\\/g, '/');
  await writeManifestEntry('css', 'colors', normalizedPath, { names: ['colors'] });
}

main();
