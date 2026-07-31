import itemsData from '../../../backend/items.json';

export async function GET() {
  return new Response(JSON.stringify(itemsData, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
