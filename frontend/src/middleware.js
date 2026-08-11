import fs from 'node:fs';
import path from 'node:path';
import { resolveProductImagePath } from './lib/paths.js';

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif'
};

function securityHeaders(response) {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  return response;
}

/**
 * Pages are rendered on demand so admin imports appear without a rebuild, which
 * previously meant every crawler hit re-read and re-parsed items.json. A short
 * shared TTL plus a long stale-while-revalidate window lets a CDN or reverse
 * proxy serve instantly while still picking up catalogue edits within a minute.
 *
 * Deliberately not applied to /admin or /api — those must never be cached, and
 * they are already noindex.
 */
function cacheableHtml(url, response) {
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api/')) {
    response.headers.set('cache-control', 'no-store');
    return response;
  }
  if (response.status !== 200 || response.headers.has('cache-control')) return response;

  const type = response.headers.get('content-type') || '';
  const cacheable = /text\/html|application\/xml|text\/plain|application\/json/.test(type);
  if (cacheable) {
    response.headers.set('cache-control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=600');
  }
  return response;
}

export async function onRequest(context, next) {
  const url = new URL(context.request.url);

  if (url.pathname.startsWith('/images/')) {
    const filePath = resolveProductImagePath(url.pathname);
    if (filePath) {
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const body = fs.readFileSync(filePath);
      return securityHeaders(
        new Response(body, {
          status: 200,
          headers: {
            'content-type': MIME[ext] || 'application/octet-stream',
            'cache-control': 'public, max-age=604800'
          }
        })
      );
    }
  }

  const response = await next();
  return cacheableHtml(url, securityHeaders(response));
}
