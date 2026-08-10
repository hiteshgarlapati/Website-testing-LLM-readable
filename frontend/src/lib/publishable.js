import { resolveProductImagePath } from './paths.js';

const PLACEHOLDER_PATHS = new Set([
  '/images/placeholder-product.svg',
  '/images/p1.png'
]);

/** True when the product has a real image file on disk (not a placeholder). */
export function itemHasPublishableImage(item) {
  const img = item?.image;
  if (!img || typeof img !== 'string') return false;
  if (PLACEHOLDER_PATHS.has(img) || img.includes('placeholder-product')) return false;
  return Boolean(resolveProductImagePath(img));
}

/** Items that may appear on the public site and in machine-readable feeds. */
export function publishableItems(items) {
  return items.filter(itemHasPublishableImage);
}
