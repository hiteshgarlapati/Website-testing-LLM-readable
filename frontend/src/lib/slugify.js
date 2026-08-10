/** URL-safe slug from a product name. */
export function slugify(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
