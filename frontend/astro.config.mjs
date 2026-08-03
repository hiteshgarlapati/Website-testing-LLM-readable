import { defineConfig } from 'astro/config';
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
  site: SITE_URL,
  vite: {
    server: {
      fs: {
        allow: [__dirname]
      }
    }
  }
});
