import ExcelJS from 'exceljs';
import path from 'node:path';
import fs from 'node:fs/promises';
import { slugify } from './slugify.js';
import { CATEGORIES } from './catalogue.js';
import { readItems } from './itemsStore.js';
import { loadWorkbookBuffer } from './xlsxWorkbook.js';

const HEADER_ALIASES = {
  name: ['name'],
  description: ['description'],
  price: ['price'],
  salePercentage: ['sale percentage', 'sale %', 'salepercentage'],
  availability: ['availability'],
  featured: ['featured'],
  image1: ['image1'],
  image2: ['image2'],
  image3: ['image3']
};

function normalizeHeader(cell) {
  return String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function mapHeaders(headerRow) {
  const index = {};
  headerRow.forEach((cell, col) => {
    const key = normalizeHeader(cell);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(key)) index[field] = col + 1;
    }
  });
  if (!index.name || !index.price) {
    throw new Error('Sheet must include Name and Price columns (see catalogue template).');
  }
  return index;
}

function parseMoney(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseSale(value) {
  const n = parseMoney(value);
  if (n == null) return 0;
  return Math.min(100, Math.max(0, n));
}

function parseAvailability(raw) {
  const v = String(raw ?? 'in_stock').trim().toLowerCase().replace(/\s+/g, '_');
  if (v === 'out_of_stock' || v === 'outofstock') {
    return {
      availability: 'Out of stock',
      schemaAvailability: 'https://schema.org/OutOfStock'
    };
  }
  return {
    availability: 'In stock',
    schemaAvailability: 'https://schema.org/InStock'
  };
}

function parseFeatured(raw) {
  const v = String(raw ?? 'no').trim().toLowerCase();
  return v === 'yes' || v === 'true' || v === '1';
}

function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

function buildSearchTerms(name, categoryName, price, description) {
  return [name, categoryName, price, description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Images anchored in worksheet cells, keyed by "row:col" (1-based). */
function imagesByCell(worksheet, workbook) {
  const map = new Map();
  for (const img of worksheet.getImages()) {
    const tl = img.range?.tl;
    if (!tl) continue;
    const row = (tl.nativeRow ?? tl.row ?? 0) + 1;
    const col = (tl.nativeCol ?? tl.col ?? 0) + 1;
    const media = workbook.getImage(img.imageId);
    if (!media?.buffer) continue;
    map.set(`${row}:${col}`, media);
  }
  return map;
}

function extFromMedia(media) {
  const t = (media.extension || media.type || 'png').toLowerCase();
  if (t === 'jpeg') return 'jpg';
  return t.replace(/[^a-z0-9]/g, '') || 'png';
}

async function saveProductImages({ slug, rowNumber, cols, imagesByCellMap, imagesDir, row }) {
  const paths = [];
  let idx = 0;
  for (const col of cols) {
    if (!col) continue;
    const media = imagesByCellMap.get(`${rowNumber}:${col}`);
    if (media?.buffer) {
      idx += 1;
      const ext = extFromMedia(media);
      const filename = `${slug}-${idx}.${ext}`;
      await fs.writeFile(path.join(imagesDir, filename), media.buffer);
      paths.push(`/images/${filename}`);
      continue;
    }
    if (row) {
      const cell = row.getCell(col);
      const text = String(cell.text ?? cell.value ?? '').trim();
      if (text.startsWith('/images/') && /\.(jpe?g|png|webp|gif)$/i.test(text)) {
        paths.push(text);
      }
    }
  }
  return paths;
}

function categoryMeta(categoryId) {
  const cat = CATEGORIES.find(c => c.id === categoryId);
  if (!cat) throw new Error(`Unknown catalogue: ${categoryId}`);
  return cat;
}

function skipEntry(row, name, reason) {
  return { row, name: name || undefined, reason };
}

function parseProductRow(row, rowNumber, cols, slugSet) {
  const name = String(row.getCell(cols.name).text ?? row.getCell(cols.name).value ?? '').trim();
  if (!name) return null;

  const basePrice = parseMoney(row.getCell(cols.price).value);
  if (basePrice == null) {
    throw new Error('Price is required.');
  }
  const sale = cols.salePercentage ? parseSale(row.getCell(cols.salePercentage).value) : 0;
  const price = Math.round(basePrice * (1 - sale / 100));

  const description = cols.description
    ? String(row.getCell(cols.description).text ?? row.getCell(cols.description).value ?? '').trim()
    : '';

  const avail = cols.availability
    ? parseAvailability(row.getCell(cols.availability).value)
    : parseAvailability('in_stock');

  const featured = cols.featured ? parseFeatured(row.getCell(cols.featured).value) : false;

  let slug = slugify(name);
  if (!slug) throw new Error('Could not derive a URL slug from the product name.');
  if (slugSet.has(slug)) slug = `${slug}-${rowNumber}`;
  slugSet.add(slug);

  return {
    rowNumber,
    name,
    slug,
    description,
    price,
    featured,
    availability: avail.availability,
    schemaAvailability: avail.schemaAvailability,
    imageCols: [cols.image1, cols.image2, cols.image3].filter(Boolean)
  };
}

/**
 * Parse an uploaded workbook for one catalogue category and merge into items.json.
 * Replaces every product in that category; other categories are unchanged.
 * Rows that fail validation or image handling are skipped (not published).
 */
export async function importCategoryFromWorkbook(buffer, categoryId, { imagesDir }) {
  const category = categoryMeta(categoryId);
  const { workbook, zipImages } = await loadWorkbookBuffer(buffer, ExcelJS);

  const worksheet = workbook.getWorksheet('Products') ?? workbook.worksheets[0];
  if (!worksheet) throw new Error('Workbook has no worksheets.');

  const headerRow = worksheet.getRow(1).values.slice(1);
  const cols = mapHeaders(headerRow);
  const cellImages = zipImages ?? imagesByCell(worksheet, workbook);

  const parsed = [];
  const skipped = [];
  const slugSet = new Set();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    let name = '';
    try {
      name = String(row.getCell(cols.name).text ?? row.getCell(cols.name).value ?? '').trim();
      const product = parseProductRow(row, rowNumber, cols, slugSet);
      if (product) parsed.push(product);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Could not read this row.';
      skipped.push(skipEntry(rowNumber, name, reason));
    }
  });

  const existing = await readItems();
  const kept = existing.filter(item => item.categoryId !== categoryId);
  const otherSlugs = new Set(kept.map(i => i.slug));

  let maxId = existing.reduce((m, i) => {
    const match = /^p(\d+)$/i.exec(i.id || '');
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);

  const newItems = [];
  const MAX_ROWS = 200;

  for (const row of parsed) {
    if (newItems.length >= MAX_ROWS) {
      skipped.push(skipEntry(row.rowNumber, row.name, 'Maximum 200 products per upload.'));
      continue;
    }

    try {
      let slug = row.slug;
      if (otherSlugs.has(slug)) slug = `${slug}-${categoryId}`;
      otherSlugs.add(slug);

      maxId += 1;
      const imagePaths = await saveProductImages({
        slug,
        rowNumber: row.rowNumber,
        cols: row.imageCols,
        imagesByCellMap: cellImages,
        imagesDir,
        row: worksheet.getRow(row.rowNumber)
      });

      if (imagePaths.length === 0) {
        throw new Error('No product image in Image1–Image3 for this row.');
      }

      const item = {
        id: `p${maxId}`,
        name: row.name,
        slug,
        category: category.name,
        categoryId: category.id,
        price: row.price,
        formattedPrice: formatPrice(row.price),
        availability: row.availability,
        schemaAvailability: row.schemaAvailability,
        description: row.description || row.name,
        specs: [],
        searchTerms: buildSearchTerms(row.name, category.name, row.price, row.description),
        image: imagePaths[0],
        ...(imagePaths.length > 1 ? { images: imagePaths } : {}),
        ...(row.featured ? { featured: true } : {})
      };
      newItems.push(item);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Could not save this product.';
      skipped.push(skipEntry(row.rowNumber, row.name, reason));
    }
  }

  const merged = [...kept, ...newItems];
  merged.sort((a, b) => {
    const order = CATEGORIES.map(c => c.id);
    const ca = order.indexOf(a.categoryId);
    const cb = order.indexOf(b.categoryId);
    if (ca !== cb) return ca - cb;
    return a.name.localeCompare(b.name);
  });

  return {
    items: merged,
    imported: newItems.length,
    skipped,
    category: category.name
  };
}
