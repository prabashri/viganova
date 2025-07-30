// src/scripts/generate-all.mjs
// This script runs all necessary generation scripts in sequence
import { execSync } from 'child_process';

function run(script, label) {
  try {
    console.log(`\n▶️  Running ${label}...`);
    execSync(script, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`⚠️  Failed to run ${label}: ${err.message}`);
  }
}

// Run all generate scripts

run('npx tsx src/scripts/generate-colors-css.ts', 'Colors CSS Generation');
run('npx tsx src/scripts/generate-site-logo.ts', 'Site Logo Generation');
run('npx tsx src/scripts/generate-last-modified-date.ts', 'Last Modified Date');
run('npx tsx src/scripts/generate-images.ts', 'Image Generation');
run('npx tsx src/scripts/generate-search-index.ts', 'Search Index');
run('npx tsx src/scripts/generate-search-assets.ts', 'Fuse Assets Checking');
run('npx tsx src/scripts/generate-email-hash.ts', 'Email Hash');
run('npx tsx src/scripts/generate-inline-css.ts', 'Inline CSS');
run('npx tsx src/scripts/generate-main-css.ts', 'Main CSS');
run('npx tsx src/scripts/generate-non-critical-css.ts', 'Non-Critical CSS');
run('npx tsx src/scripts/generate-minified-scripts.ts', 'Minified Scripts');
run('npx tsx src/scripts/generate-web-manifest.ts', 'Web Manifest');
run('npx tsx src/scripts/generate-sw.ts', 'Service Worker Generation');

/**
 * "gen:headers": "node src/scripts/generate-headers.mjs",
    "generate:last-modified-date": "node src/scripts/generate-last-modified-date.mjs",
    "generate:inline-css": "node src/scripts/generate-inline-css.mjs",
    "generate:main-css": "node src/scripts/generate-main-css.mjs",
    "generate:non-critical-css": "node src/scripts/generate-non-critical-css.mjs",
    "generate:minified-scripts": "node src/scripts/generate-minified-scripts.mjs",
    "generate:assets": "npm run generate:inline-css && npm run generate:main-css && npm run generate:non-critical-css && npm run generate:minified-scripts",
 * 
 */
