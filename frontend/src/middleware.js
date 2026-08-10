import fs from 'node:fs';
import path from 'node:path';
import { resolveProductImagePath } from './lib/paths.js';

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml'
};

function securityHeaders(response) {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
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
    return securityHeaders(new Response('Not found', { status: 404 }));
  }

  const response = await next();
  return securityHeaders(response);
}
