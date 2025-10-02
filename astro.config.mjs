// astro.config.mjs or astro.config.js
// @ts-check
import { defineConfig } from 'astro/config';
import icon from "astro-icon";
import mdx from '@astrojs/mdx';
import cloudflare from '@astrojs/cloudflare';
import path from 'path';

// ⛳️ relative import (no "@/")
import { siteDefaults } from './src/config/siteDefaults';

export default defineConfig({
  site: siteDefaults.siteUrl || siteDefaults.cloudflareUrl,
  integrations: [mdx(), icon()],
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
    ssr: {
      noExternal: ['astro-icon'], // ✅ helps SSR bundling
    },
  },
});