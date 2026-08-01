export const prerender = false;

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { getItemsCollection, updateItem } from '../../lib/db.js';

// frontend/src/pages/api/ -> frontend/public/images (local fallback storage)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, '../../../public/images');

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

// Cloudinary is configured via CLOUDINARY_URL in .env:
//   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
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
    // Upload to Cloudinary; returns a permanent CDN URL
    const dataUri = `data:${imageFile.type || 'image/png'};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'oakline',
      public_id: `${slug}-${Date.now()}`,
      resource_type: 'image'
    });
    return result.secure_url;
  }

  // Fallback: save locally into public/images
  const filename = `${slug}-${Date.now()}${ext}`;
  await fs.writeFile(path.join(IMAGES_DIR, filename), buffer);
  return `/images/${filename}`;
}

export async function POST({ request, redirect }) {
  const formData = await request.formData();
  const id = formData.get('id');
  const name = (formData.get('name') || '').toString().trim();
  const imageFile = formData.get('image');

  const col = await getItemsCollection();
  const item = await col.findOne({ id });

  if (!item) {
    return new Response(JSON.stringify({ error: `Unknown item: ${id}` }), {
      status: 404,
      headers: { 'content-type': 'application/json' }
    });
  }

  const updates = {};

  // Update name (keep slug/id stable so URLs don't break)
  if (name) {
    updates.name = name;
  }

  // Store the new image, if one was uploaded
  if (imageFile && typeof imageFile === 'object' && imageFile.size > 0) {
    try {
      updates.image = await storeImage(imageFile, item.slug);
    } catch (err) {
      const message = err?.error?.message || err?.message || 'Image upload failed';
      console.error('[admin] image upload failed for', id, '-', message, err);
      return redirect(
        `/admin?error=${encodeURIComponent(message)}&item=${encodeURIComponent(item.name)}`,
        303
      );
    }
  }

  if (Object.keys(updates).length > 0) {
    await updateItem(id, updates);
  }

  return redirect(`/admin?saved=${encodeURIComponent(item.id)}`, 303);
}

// Static builds try to prerender endpoints with GET; return a stub so it doesn't fail.
export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Use POST. This endpoint only works on the dev server.' }),
    { status: 405, headers: { 'content-type': 'application/json' } }
  );
}
