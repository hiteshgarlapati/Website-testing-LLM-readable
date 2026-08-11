/**
 * Intrinsic image dimensions read from the file header on disk.
 *
 * Product cards set `aspect-ratio: 4/3` in CSS, which stops layout shift only
 * after the stylesheet applies. Width/height attributes on the <img> let the
 * browser reserve the box from the HTML alone, which is what Cumulative Layout
 * Shift actually measures.
 *
 * Dimensions are read from the header bytes rather than decoding the image, so
 * this costs a few hundred bytes of I/O per file, and each result is cached for
 * the life of the process. Images uploaded through /admin are picked up on
 * first request without a rebuild.
 */

import fs from 'node:fs';
import { resolveProductImagePath } from './paths.js';

const cache = new Map();

/** PNG stores width/height as big-endian uint32 at a fixed offset in IHDR. */
function pngSize(buffer) {
  if (buffer.length < 24) return null;
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * JPEG has no fixed offset — walk the marker segments until a Start Of Frame
 * (SOF0-SOF15, excluding the non-dimension markers DHT/JPG/DAC) is reached.
 */
function jpegSize(buffer) {
  if (buffer.length < 4 || buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    // Standalone markers carry no length payload.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buffer.readUInt16BE(offset + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

/** GIF and WebP (VP8X/VP8L/VP8) headers, for completeness with the MIME list. */
function gifSize(buffer) {
  if (buffer.length < 10 || buffer.toString('ascii', 0, 3) !== 'GIF') return null;
  return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
}

function webpSize(buffer) {
  if (buffer.length < 30 || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
  const format = buffer.toString('ascii', 12, 16);
  if (format === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    };
  }
  if (format === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (format === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

/**
 * Intrinsic size for a public image path such as `/images/foo.jpg`.
 * Returns null when the file is missing or the header cannot be parsed —
 * callers omit the attributes rather than emitting a guessed size.
 */
export function imageSize(urlPath) {
  if (cache.has(urlPath)) return cache.get(urlPath);

  let size = null;
  try {
    const filePath = resolveProductImagePath(urlPath);
    if (filePath) {
      const handle = fs.openSync(filePath, 'r');
      try {
        const fileBytes = fs.fstatSync(handle).size;
        const read = length => {
          const buffer = Buffer.alloc(Math.min(length, fileBytes));
          fs.readSync(handle, buffer, 0, buffer.length, 0);
          return buffer;
        };

        // 64 KB covers the header of nearly every file here.
        const head = read(65536);
        size = pngSize(head) || jpegSize(head) || webpSize(head) || gifSize(head);

        // A JPEG carrying a large ICC or EXIF payload can push the Start Of
        // Frame past that window — one image in this catalogue has ~590 KB of
        // colour profile ahead of it. Re-read in full before giving up.
        if (!size && fileBytes > 65536 && head.length >= 2 && head.readUInt16BE(0) === 0xffd8) {
          size = jpegSize(read(fileBytes));
        }
      } finally {
        fs.closeSync(handle);
      }
    }
  } catch {
    size = null;
  }

  if (size && (!Number.isFinite(size.width) || !Number.isFinite(size.height) || size.width <= 0 || size.height <= 0)) {
    size = null;
  }

  cache.set(urlPath, size);
  return size;
}
