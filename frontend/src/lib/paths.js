import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

function firstExisting(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return paths[0];
}

/** Writable catalogue root in production (`DATA_DIR`, e.g. Docker volume `/app/data`). */
export function dataRoot() {
  const env = process.env.DATA_DIR?.trim();
  if (env) return path.resolve(env);
  return null;
}

export function itemsJsonPath() {
  const root = dataRoot();
  if (root) return path.join(root, 'items.json');
  return firstExisting([
    path.join(LIB_DIR, '../data/items.json'),
    path.join(process.cwd(), 'src/data/items.json'),
    path.join(process.cwd(), 'frontend/src/data/items.json')
  ]);
}

export function productImagesDir() {
  const root = dataRoot();
  if (root) return path.join(root, 'images');
  return firstExisting([
    path.join(LIB_DIR, '../../public/images'),
    path.join(process.cwd(), 'public/images'),
    path.join(process.cwd(), 'frontend/public/images')
  ]);
}

/** Read-only bundled images in Docker (`/app/seed/images`). */
export function seedImagesDir() {
  const env = process.env.SEED_DIR?.trim();
  if (env) {
    const dir = path.join(path.resolve(env), 'images');
    if (fs.existsSync(dir)) return dir;
  }
  const dockerDefault = '/app/seed/images';
  if (fs.existsSync(dockerDefault)) return dockerDefault;
  return null;
}

export function bundledSeedItemsJson() {
  const env = process.env.SEED_DIR?.trim();
  const candidates = [];
  if (env) candidates.push(path.join(path.resolve(env), 'items.json'));
  candidates.push('/app/seed/items.json');
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Resolve `/images/foo.jpg` to an on-disk file (data volume, seed bundle, or built `public/`). */
export function resolveProductImagePath(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return null;
  const rel = urlPath.replace(/^\//, '');
  if (!/^images\/.+\.(jpe?g|png|webp|gif|svg)$/i.test(rel)) return null;
  const filename = rel.replace(/^images\//, '');
  const dataFile = path.join(productImagesDir(), filename);
  if (fs.existsSync(dataFile)) return dataFile;
  const seedDir = seedImagesDir();
  if (seedDir) {
    const seedFile = path.join(seedDir, filename);
    if (fs.existsSync(seedFile)) return seedFile;
  }
  const publicFile = firstExisting([
    path.join(LIB_DIR, '../../public', rel),
    path.join(process.cwd(), 'public', rel),
    path.join(process.cwd(), 'frontend/public', rel),
    path.join(process.cwd(), 'dist/client', rel)
  ]);
  return fs.existsSync(publicFile) ? publicFile : null;
}
