import fs from 'fs/promises';
import path from 'path';
import { siteColors } from '../config/siteColors';
import { readManifest, writeManifestEntry } from '../utils/write-manifest';

const cssPath = path.resolve('./src/styles/inline/colors.css');

// --- Helpers ---
function parseColorToHSLA(color: string): { h: number, s: number, l: number, a?: number } {
  color = color.trim().toLowerCase();

  // HEX / HEX8
  if (color.startsWith('#')) {
    let hex = color.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : undefined;
      return rgbToHsla(r, g, b, a);
    }
  }

  // RGB / RGBA
  if (color.startsWith('rgb')) {
    const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return rgbToHsla(values[0], values[1], values[2], values[3]);
  }

  // HSL / HSLA
  if (color.startsWith('hsl')) {
    const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return { h: values[0], s: values[1], l: values[2], a: values[3] };
  }

  throw new Error(`Unsupported color format: ${color}`);
}

function rgbToHsla(r: number, g: number, b: number, a?: number): { h: number, s: number, l: number, a?: number } {
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
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslaToCss(hsla: { h: number, s: number, l: number, a?: number }): string {
  const alpha = hsla.a !== undefined ? `, ${Math.round(hsla.a * 100) / 100}` : '';
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%${alpha})`;
}

function generateShadeVariants(baseColor: string) {
  const hsla = parseColorToHSLA(baseColor);
  const { h, s, l, a } = hsla;
  const make = (adj: number) => hslaToCss({ h, s, l: Math.min(Math.max(l + adj, 0), 100), a });

  return {
    darkerX: make(-30),
    darker: make(-20),
    dark: make(-10),
    base: hslaToCss(hsla),
    light: make(10),
    lighter: make(20),
    lighterX: make(30)
  };
}

function generateBaseScale(lightMode = true) {
  const base: Record<string, string> = {};
  const steps = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
  for (let step of steps) {
    const val = lightMode ? (100 - step) : step;
    base[`base-${step.toString().padStart(2, '0')}`] = `hsla(0, 0%, ${val}%, 1)`;
  }
  return base;
}

function safeColor(input: string | undefined, fallback: string) {
  return input ?? fallback;
}

function resolveSecondaryBase(colors: typeof siteColors, darkMode = false) {
  if (darkMode) {
    return colors.darkSecondaryColor
      ?? colors.secondaryColor
      ?? '#ffffff';
  }
  return colors.secondaryColor ?? '#000000';
}

// --- CSS Builder ---
function generateCSS(colors: typeof siteColors): string {
  // Light mode primary/secondary
  const primaryLight = generateShadeVariants(colors.primaryColor);
  const secondaryLightBase = resolveSecondaryBase(colors, false);
  const secondaryLight = generateShadeVariants(secondaryLightBase);

  // Dark mode primary/secondary
  const primaryDarkBase = colors.darkPrimaryColor ?? colors.primaryColor;
  const secondaryDarkBase = resolveSecondaryBase(colors, true);

  const primaryDark = generateShadeVariants(primaryDarkBase);
  const secondaryDark = generateShadeVariants(secondaryDarkBase);

  // Base scales
  const baseLight = generateBaseScale(true);
  const baseDark = generateBaseScale(false);

  return `/* ================================
   🌈 CSS VARIABLES
================================ */
:root {
  color-scheme: light dark;

  /* Primary Shades */
  --primary-darker-x: ${safeColor(colors.primaryColorDarker, primaryLight.darkerX)};
  --primary-darker: ${safeColor(colors.primaryColorDark, primaryLight.darker)};
  --primary-dark: ${primaryLight.dark};
  --primary: ${primaryLight.base};
  --primary-light: ${safeColor(colors.primaryColorLight, primaryLight.light)};
  --primary-lighter: ${safeColor(colors.primaryColorLighter, primaryLight.lighter)};
  --primary-lighter-x: ${safeColor(colors.primaryColorLighterX, primaryLight.lighterX)};

  /* Secondary Shades */
  --secondary-darker-x: ${secondaryLight.darkerX};
  --secondary-darker: ${secondaryLight.darker};
  --secondary-dark: ${secondaryLight.dark};
  --secondary: ${secondaryLight.base};
  --secondary-light: ${safeColor(colors.secondaryColorLight, secondaryLight.light)};
  --secondary-lighter: ${safeColor(colors.secondaryColorLighter, secondaryLight.lighter)};
  --secondary-lighter-x: ${secondaryLight.lighterX};

  --background-color: ${colors.backgroundColor};
  --text-color: ${colors.textColor};

  ${Object.entries(baseLight).map(([k,v]) => `--${k}: ${v};`).join("\n  ")}
}

/* 🌙 Dark mode overrides */
[data-theme="dark"] {
  /* Primary Shades */
  --primary-darker-x: ${primaryDark.darkerX};
  --primary-darker: ${primaryDark.darker};
  --primary-dark: ${primaryDark.dark};
  --primary: ${primaryDark.base};
  --primary-light: ${primaryDark.light};
  --primary-lighter: ${primaryDark.lighter};
  --primary-lighter-x: ${primaryDark.lighterX};

  /* Secondary Shades */
  --secondary-darker-x: ${secondaryDark.darkerX};
  --secondary-darker: ${secondaryDark.darker};
  --secondary-dark: ${secondaryDark.dark};
  --secondary: ${secondaryDark.base};
  --secondary-light: ${secondaryDark.light};
  --secondary-lighter: ${secondaryDark.lighter};
  --secondary-lighter-x: ${secondaryDark.lighterX};

  --background-color: ${colors.darkBackgroundColor ?? '#131313'};
  --text-color: ${colors.darkTextColor ?? '#ffffff'};

  ${Object.entries(baseDark).map(([k,v]) => `--${k}: ${v};`).join("\n  ")}
}
`;
}

// --- Change Detector ---
async function colorsChangedSinceLastBuild(): Promise<boolean> {
  const manifest = await readManifest();
  const manifestEntry = manifest.css?.colors;

  try {
    const colorsStat = await fs.stat(path.resolve('./src/config/colors.ts'));
    if (!manifestEntry?.datetime) return true;

    const manifestTime = new Date(manifestEntry.datetime).getTime();
    const fileTime = colorsStat.mtime.getTime();
    return fileTime > manifestTime;
  } catch {
    return true; // No manifest entry or missing file → regenerate
  }
}

// --- Main ---
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
