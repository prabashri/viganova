// astro.config.mjs or astro.config.js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import path from 'path';

// ⛳️ relative import (no "@/")
import { siteDefaults } from './src/config/siteDefaults';

export default defineConfig({
  site: siteDefaults.siteUrl || siteDefaults.cloudflareUrl,
  integrations: [mdx()],
  adapter: cloudflare({
    imageService: 'compile', // good for Pages/Workers
  }),
  output: 'server',          // ✅ SSR
  trailingSlash: 'always',
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});