import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataRoot, itemsJsonPath, productImagesDir } from './paths.js';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

function bundledItemsSeed() {
  const candidates = [
    path.join(LIB_DIR, '../data/items.json'),
    path.join(process.cwd(), 'src/data/items.json'),
    path.join(process.cwd(), 'frontend/src/data/items.json')
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function ensureCatalogueFiles() {
  const imagesDir = productImagesDir();
  await fsPromises.mkdir(imagesDir, { recursive: true });

  try {
    await fsPromises.access(ITEMS_PATH);
    return;
  } catch {
    /* seed below */
  }

  const seed = bundledItemsSeed();
  if (!seed) {
    throw new Error(`Catalogue file missing at ${ITEMS_PATH} and no seed items.json found.`);
  }
  await fsPromises.mkdir(path.dirname(ITEMS_PATH), { recursive: true });
  await fsPromises.copyFile(seed, ITEMS_PATH);
}

export const ITEMS_PATH = itemsJsonPath();
export const IMAGES_DIR = productImagesDir();

export async function readItems() {
  if (dataRoot()) await ensureCatalogueFiles();
  const raw = await fsPromises.readFile(ITEMS_PATH, 'utf8');
  return JSON.parse(raw);
}

export async function writeItems(items) {
  await fsPromises.mkdir(productImagesDir(), { recursive: true });
  const json = JSON.stringify(items, null, 2) + '\n';
  await fsPromises.writeFile(ITEMS_PATH, json, 'utf8');
}
