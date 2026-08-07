import itemsData from '../data/items.json';

// Falls back to the configured site when a request context has no origin.
const DEFAULT_SITE = 'https://oaklinefurniture.example';

const escapeXml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export async function GET(context) {
  const base = (context.site?.origin ?? DEFAULT_SITE).replace(/\/$/, '');
  const items = itemsData;

  // Prefer an explicit updatedAt when present; otherwise omit lastmod.
  const lastmodOf = item =>
    item.updatedAt ? String(item.updatedAt).slice(0, 10) : null;

  const newestEdit = items
    .map(lastmodOf)
    .filter(Boolean)
    .sort()
    .pop();

  const urls = [
    { loc: `${base}/`, changefreq: 'weekly', priority: '1.0', lastmod: newestEdit },
    { loc: `${base}/browse`, changefreq: 'weekly', priority: '0.9', lastmod: newestEdit },
    ...items.map(item => ({
      loc: `${base}/product/${item.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: lastmodOf(item)
    }))
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' }
  });
}
