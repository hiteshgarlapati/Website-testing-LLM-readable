import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Astro's config is evaluated before .env is loaded, so read it explicitly.
// Setting SITE_URL repoints every absolute URL the site emits — canonical,
// OpenGraph, JSON-LD @ids, sitemap, robots — at the live domain.
const env = loadEnv(process.env.NODE_ENV || 'development', __dirname, '');
const SITE_URL = env.SITE_URL || 'https://oaklinefurniture.example';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  site: SITE_URL,
  // Emit /product/slug.html instead of /product/slug/index.html so
  // Nginx, Apache, and GoDaddy all resolve /product/slug without 404s.
  build: {
    format: 'file'
  },
  trailingSlash: 'never',
  vite: {
    server: {
      fs: {
        allow: [__dirname]
      }
    }
  }
});
