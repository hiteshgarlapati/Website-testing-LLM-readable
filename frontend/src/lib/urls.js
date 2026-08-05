const DEFAULT_SITE = 'https://oaklinefurniture.example';

/** Normalize Astro `site` / SITE_URL to an origin without a trailing slash. */
export function siteOrigin(site) {
  if (!site) return DEFAULT_SITE;
  if (typeof site === 'string') return site.replace(/\/$/, '');
  if (site.origin) return site.origin.replace(/\/$/, '');
  return DEFAULT_SITE;
}

/**
 * Turn a site-relative path (e.g. /images/p4.png) into an absolute URL
 * so LLM crawlers can fetch the asset. Already-absolute URLs are left alone.
 */
export function absoluteUrl(site, path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteOrigin(site);
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
