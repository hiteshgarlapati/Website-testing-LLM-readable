export const prerender = false;

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { getItemsCollection, updateItem } from '../../lib/db.js';
import { requireAdmin } from '../../lib/auth.js';

// frontend/src/pages/api/ -> frontend/public/images (local dev image storage)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../../public/images');

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// In production, set CLOUDINARY_URL (cloudinary://<api_key>:<api_secret>@<cloud_name>)
// so images go to the CDN. Without it (local dev), images save to public/images.
const CLOUDINARY_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.CLOUDINARY_URL) ||
  process.env.CLOUDINARY_URL ||
  '';

let cloudinaryReady = false;
if (CLOUDINARY_URL) {
  const parsed = new URL(CLOUDINARY_URL);
  cloudinary.config({
    cloud_name: parsed.hostname,
    api_key: parsed.username,
    api_secret: parsed.password,
    secure: true
  });
  cloudinaryReady = true;
}

async function storeImage(imageFile, slug) {
  const ext = path.extname(imageFile.name).toLowerCase() || '.png';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`Unsupported image type: ${ext}`);
  }
  const buffer = Buffer.from(await imageFile.arrayBuffer());

  if (cloudinaryReady) {
    const dataUri = `data:${imageFile.type || 'image/png'};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'oakline',
      public_id: `${slug}-${Date.now()}`,
      resource_type: 'image'
    });
    return result.secure_url;
  }

  const filename = `${slug}-${Date.now()}${ext}`;
  await fs.writeFile(path.join(IMAGES_DIR, filename), buffer);
  return `/images/${filename}`;
}

export async function POST({ request, redirect }) {
  const authFail = requireAdmin(request);
  if (authFail) return authFail;

  const formData = await request.formData();
  const only = formData.get('only'); // set when a single card's Save button was used

  const col = await getItemsCollection();
  const items = await col.find({}).toArray();

  // Which items to process: one card, or every item present in the form
  const targets = only
    ? items.filter((i) => i.id === only)
    : items.filter((i) => formData.has(`name-${i.id}`));

  if (targets.length === 0) {
    return new Response(JSON.stringify({ error: 'No matching items in submission' }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    });
  }

  let savedCount = 0;

  for (const item of targets) {
    const updates = {};

    // Update name (keep slug/id stable so URLs don't break)
    const name = (formData.get(`name-${item.id}`) || '').toString().trim();
    if (name && name !== item.name) {
      updates.name = name;
    }

    // Store the new image, if one was uploaded for this item
    const imageFile = formData.get(`image-${item.id}`);
    if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
      try {
        updates.image = await storeImage(imageFile, item.slug);
      } catch (err) {
        const message = err?.message || 'Image upload failed';
        console.error('[admin] image upload failed for', item.id, '-', message);
        return redirect(
          `/admin?error=${encodeURIComponent(message)}&item=${encodeURIComponent(item.name)}`,
          303
        );
      }
    }

    if (Object.keys(updates).length > 0) {
      await updateItem(item.id, updates);
    }
    savedCount++;
  }

  if (only) {
    return redirect(`/admin?saved=${encodeURIComponent(only)}`, 303);
  }
  return redirect(`/admin?savedAll=${savedCount}`, 303);
}

// Static builds try to prerender endpoints with GET; return a stub so it doesn't fail.
export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Use POST. This endpoint only works on the dev server.' }),
    { status: 405, headers: { 'content-type': 'application/json' } }
  );
}
