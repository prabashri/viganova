// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import path from 'path';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://template-ssr.astroweb.dev',
  integrations: [mdx(), sitemap(), icon()],
  adapter: cloudflare(),
  output: 'server',
  trailingSlash: 'always', 
  
    vite: {
      resolve: {
        alias: {
          '@': path.resolve('./src')
        }
      }
    },
});