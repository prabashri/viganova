// src/scripts/generate-colors-css.ts
import fs from 'fs/promises';
import path from 'path';
import { siteColors } from '../config/siteColors';
import { readManifest, writeManifestEntry } from '../utils/write-manifest';

const cssPath = path.resolve('./src/styles/inline/colors.css');

/* -------------------------
   🎨 Helpers
------------------------- */
function clampLightness(l: number, userProvided?: boolean): number {
  if (userProvided) return Math.round(l); // respect user exact value
  return Math.min(Math.max(Math.round(l), 5), 95); // clamp auto-generated
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

  // HEX / HEXA
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

  // RGB / RGBA
  if (color.startsWith('rgb')) {
    const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return adjustIfExtreme(rgbToHsla(values[0], values[1], values[2], values[3]));
  }

  // HSL / HSLA
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
function generateBaseScale() {
  const base: Record<string, string> = {};
  const steps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];

  for (let step of steps) {
    let val = 100 - step; // White at base-00, black at base-100

    // Format key: base-00, base-05, ..., base-100
    const key =
      step === 100
        ? 'base-100'
        : `base-${step.toString().padStart(2, '0')}`;

    base[key] = `hsla(0, 0%, ${val}%, 1)`;
  }

  return base;
}



/* -------------------------
   🎨 CSS Builder
------------------------- */
function generateCSS(colors: typeof siteColors) {
  const primaryShades = generateColorSet(colors.primaryColor, {
    'darker-x': colors.primaryColorDarkerX,
    'darker': colors.primaryColorDarker,
    'dark': colors.primaryColorDark,
    'base': colors.primaryColor,
    'light': colors.primaryColorLight,
    'lighter': colors.primaryColorLighter,
    'lighter-x': colors.primaryColorLighterX
  });

  const secondaryShades = generateColorSet(colors.secondaryColor, {
    'darker-x': colors.secondaryColorDarkerX,
    'darker': colors.secondaryColorDarker,
    'dark': colors.secondaryColorDark,
    'base': colors.secondaryColor,
    'light': colors.secondaryColorLight,
    'lighter': colors.secondaryColorLighter,
    'lighter-x': colors.secondaryColorLighterX
  });

  const primaryDarkShades = generateColorSet(colors.darkPrimaryColor ?? colors.primaryColor, {} as any);
  const secondaryDarkShades = generateColorSet(colors.darkSecondaryColor ?? colors.secondaryColor, {} as any);

  const baseLight = generateBaseScale();
  const baseDark = generateBaseScale();

  return `/* ================================
   🌈 CSS VARIABLES
================================ */
:root {
  color-scheme: light dark;
  ${Object.entries(primaryShades).map(([k,v]) => `--primary-${k}: ${v};`).join("\n  ")}

  ${Object.entries(secondaryShades).map(([k,v]) => `--secondary-${k}: ${v};`).join("\n  ")}

  --background-color: ${hslaToCss(parseColorToHSLA(colors.backgroundColor, true))};
  --text-color: ${hslaToCss(parseColorToHSLA(colors.textColor, true))};

  ${Object.entries(baseLight).map(([k,v]) => `--${k}: ${v};`).join("\n  ")}
}

[data-theme="dark"] {
  ${Object.entries(primaryDarkShades).map(([k,v]) => `--primary-${k}: ${v};`).join("\n  ")}

  ${Object.entries(secondaryDarkShades).map(([k,v]) => `--secondary-${k}: ${v};`).join("\n  ")}

  --background-color: ${hslaToCss(parseColorToHSLA(colors.darkBackgroundColor, true))};
  --text-color: ${hslaToCss(parseColorToHSLA(colors.darkTextColor, true))};

  ${Object.entries(baseDark).map(([k,v]) => `--${k}: ${v};`).join("\n  ")}
}`;
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
