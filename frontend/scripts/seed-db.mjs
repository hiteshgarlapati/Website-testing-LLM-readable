/**
 * Seed MongoDB from backend/items.json.
 * Usage: node scripts/seed-db.mjs [--force]
 *   --force  overwrite existing documents with the JSON data
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ITEMS_JSON = path.resolve(__dirname, '../../backend/items.json');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

const force = process.argv.includes('--force');
const items = JSON.parse(await fs.readFile(ITEMS_JSON, 'utf-8'));

const client = new MongoClient(MONGODB_URI);
await client.connect();
const col = client.db('oakline').collection('items');

const existing = await col.countDocuments();
if (existing > 0 && !force) {
  console.log(`Collection already has ${existing} items — skipping seed. Use --force to overwrite.`);
} else {
  for (const [index, item] of items.entries()) {
    await col.replaceOne(
      { id: item.id },
      { ...item, position: index + 1 },
      { upsert: true }
    );
  }
  await col.createIndex({ slug: 1 }, { unique: true });
  console.log(`Seeded ${items.length} items into MongoDB (oakline.items).`);
}

await client.close();
