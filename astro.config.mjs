// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import path from 'path';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://astroweb.dev',
  integrations: [mdx(), sitemap(), icon()],
  adapter: cloudflare({
     imageService: 'compile'
  }),
  build: {
    // Inline stylesheets up to 6KB
    inlineStylesheets: "always",
  },
  output: 'server',
  trailingSlash: 'always', 
  
    vite: {
      build: {
      assetsInlineLimit: 6 * 1024 // 6 KB
    },
      css: {
        transformer: "lightningcss",
      },
      resolve: {
        alias: {
          '@': path.resolve('./src')
        }
      }
    },
});