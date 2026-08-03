import itemsData from '../data/items.json';

// Pure JSON endpoint — prerendered at build time for static hosting (GoDaddy, etc.)
export async function GET() {
  return new Response(JSON.stringify(itemsData, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'content-disposition': 'inline; filename="products.json"'
    }
  });
}
