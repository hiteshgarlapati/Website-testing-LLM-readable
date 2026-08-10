import { readItems } from '../lib/itemsStore.js';
import { absoluteUrl } from '../lib/urls.js';
import { publishableItems } from '../lib/publishable.js';

export const prerender = false;

// Pure JSON endpoint — served at runtime so admin uploads refresh without rebuild.
// Image fields are absolute so LLM agents can fetch pictures by URL.
export async function GET(context) {
  const itemsData = await readItems();
  const items = publishableItems(itemsData).map((item) => ({
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
