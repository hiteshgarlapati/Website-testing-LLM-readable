import { MongoClient } from 'mongodb';

const MONGODB_URI =
  (typeof import.meta !== 'undefined' && import.meta.env?.MONGODB_URI) ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017';
const DB_NAME = 'oakline';
const COLLECTION = 'items';

// Reuse one client across hot-reloads in dev to avoid piling up connections
const globalScope = globalThis;
if (!globalScope.__oaklineMongoClientPromise) {
  const client = new MongoClient(MONGODB_URI);
  globalScope.__oaklineMongoClientPromise = client.connect();
}
const clientPromise = globalScope.__oaklineMongoClientPromise;

export async function getItemsCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION);
}

/** All items in catalogue order, without Mongo's internal _id field. */
export async function getAllItems() {
  const col = await getItemsCollection();
  return col.find({}, { projection: { _id: 0 } }).sort({ position: 1 }).toArray();
}

/** A single item by its slug, or null. */
export async function getItemBySlug(slug) {
  const col = await getItemsCollection();
  return col.findOne({ slug }, { projection: { _id: 0 } });
}

/** Update fields on an item by id. Returns the updated item, or null if not found. */
export async function updateItem(id, updates) {
  const col = await getItemsCollection();
  const result = await col.findOneAndUpdate(
    { id },
    { $set: updates },
    { returnDocument: 'after', projection: { _id: 0 } }
  );
  return result;
}
