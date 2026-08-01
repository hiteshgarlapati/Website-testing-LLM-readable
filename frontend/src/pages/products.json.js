import { getAllItems } from '../lib/db.js';

export async function GET() {
  const items = await getAllItems();
  return new Response(JSON.stringify(items, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}
