// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import cloudflare from '@astrojs/cloudflare';
import path from 'path';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://easyapostille.pages.dev',
  integrations: [
    mdx(),   
    icon()
  ],
  adapter: cloudflare({
     imageService: 'compile'
  }),
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