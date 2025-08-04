// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';
import path from 'path';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://astroweb-template-ssr.pages.dev',
  integrations: [
    mdx(),
    sitemap(

    ),
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