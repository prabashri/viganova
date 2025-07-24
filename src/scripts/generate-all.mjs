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
run('node src/scripts/generate-last-modified-date.mjs', 'Last Modified Date');
run('npx tsx src/scripts/generate-images.ts', 'Image Generation');
run('node src/scripts/generate-email-hash.mjs', 'Email Hash');
run('node src/scripts/generate-inline-css.mjs', 'Inline CSS');
run('node src/scripts/generate-main-css.mjs', 'Main CSS');
run('node src/scripts/generate-non-critical-css.mjs', 'Non-Critical CSS');
run('node src/scripts/generate-minified-scripts.mjs', 'Minified Scripts');

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
