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

/** Trust Host / X-Forwarded-* for SSR origin checks when behind TLS reverse proxies. */
function allowedDomainsFromSiteUrl(siteUrl) {
  const patterns = [];
  try {
    const u = new URL(siteUrl);
    const protocol = u.protocol.replace(':', '');
    const hostname = u.hostname;
    patterns.push({ protocol, hostname });
    if (hostname.startsWith('www.')) {
      patterns.push({ protocol, hostname: hostname.slice(4) });
    } else if (!hostname.includes('localhost') && !hostname.endsWith('.local')) {
      patterns.push({ protocol, hostname: `www.${hostname}` });
    }
    const labels = hostname.split('.');
    if (labels.length >= 2 && !hostname.includes('localhost')) {
      const apex = labels.slice(-2).join('.');
      patterns.push({ protocol, hostname: apex });
      patterns.push({ protocol, hostname: `**.${apex}` });
    }
  } catch {
    /* ignore */
  }
  if (process.env.NODE_ENV !== 'production') {
    patterns.push({ hostname: 'localhost' });
    patterns.push({ hostname: '127.0.0.1' });
  }
  return patterns;
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  site: SITE_URL,
  security: {
    checkOrigin: true,
    allowedDomains: allowedDomainsFromSiteUrl(SITE_URL)
  },
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
