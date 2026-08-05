import itemsData from '../data/items.json';
import { absoluteUrl } from '../lib/urls.js';

// Pure JSON endpoint — prerendered at build time for static hosting (GoDaddy, etc.)
// Image fields are absolute so LLM agents can fetch pictures by URL.
export async function GET(context) {
  const items = itemsData.map((item) => ({
    ...item,
    image: absoluteUrl(context.site, item.image)
  }));

  return new Response(JSON.stringify(items, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'inline; filename="products.json"'
    }
  });
}
