import { MongoClient } from 'mongodb';
import bundledItems from '../data/items.json';

const MONGODB_URI =
  (typeof import.meta !== 'undefined' && import.meta.env?.MONGODB_URI) ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017';
const DB_NAME = 'oakline';
const COLLECTION = 'items';

// The catalogue that ships in the repo. Served when Mongo is unreachable so
// crawlers and visitors get real content instead of a 500. Mirrors the shape
// seed-db.mjs writes, including the position field it derives from array order.
const FALLBACK_ITEMS = bundledItems.map((item, index) => ({ ...item, position: index + 1 }));

const globalScope = globalThis;

function connect() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const promise = client.connect();
  // Callers handle failure via withCollection; this keeps a rejected connect
  // from surfacing as an unhandled rejection and killing the server process.
  promise.catch(() => {});
  return promise;
}

/** Cached connection, reused across hot-reloads to avoid piling up clients. */
function getClientPromise() {
  if (!globalScope.__oaklineMongoClientPromise) {
    globalScope.__oaklineMongoClientPromise = connect();
  }
  return globalScope.__oaklineMongoClientPromise;
}

export async function getItemsCollection() {
  const client = await getClientPromise();
  return client.db(DB_NAME).collection(COLLECTION);
}

/**
 * Run a read against Mongo, falling back to the bundled catalogue on failure.
 * Only reads get a fallback — writes must fail loudly rather than pretend.
 */
async function read(operation, fallback) {
  try {
    return await operation(await getItemsCollection());
  } catch (err) {
    // Drop the cached promise so the next request retries the connection
    // instead of being pinned to the fallback until the process restarts.
    globalScope.__oaklineMongoClientPromise = null;
    console.error(`[db] MongoDB unavailable, serving bundled catalogue: ${err.message}`);
    return fallback();
  }
}

/** All items in catalogue order, without Mongo's internal _id field. */
export async function getAllItems() {
  return read(
    col => col.find({}, { projection: { _id: 0 } }).sort({ position: 1 }).toArray(),
    () => FALLBACK_ITEMS
  );
}

/** A single item by its slug, or null. */
export async function getItemBySlug(slug) {
  return read(
    col => col.findOne({ slug }, { projection: { _id: 0 } }),
    () => FALLBACK_ITEMS.find(item => item.slug === slug) ?? null
  );
}

/** Update fields on an item by id. Returns the updated item, or null if not found. */
export async function updateItem(id, updates) {
  const col = await getItemsCollection();
  const result = await col.findOneAndUpdate(
    { id },
    { $set: { ...updates, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  return result;
}
