/**
 * Category definitions and slot layout shared by the home and browse pages,
 * so both render the same catalogue from items.json rather than duplicating
 * hand-written markup.
 */

export const CATEGORIES = [
  { id: 'sofas', name: 'Sofas', prefix: 'SOF', subtitle: 'Oak frames with washable covers you can re-order on their own' },
  { id: 'chairs', name: 'Chairs', prefix: 'CHA', subtitle: 'Sold singly, so a set can be built one chair at a time' },
  { id: 'tables', name: 'Tables', prefix: 'TAB', subtitle: 'Hardwax-oiled tops that can be spot-repaired at home' },
  { id: 'beds', name: 'Beds', prefix: 'BED', subtitle: 'Slatted platforms in maple, oak and ash — no box spring needed' }
];

/**
 * Reserved catalogue slots per category. Filled slots come from items.json;
 * the remainder render as open placeholders. Set to 0 to show only real
 * pieces — the placeholders are presentation, never indexed content.
 */
export const SLOTS_PER_CATEGORY = 20;

/** Lowercase haystack used by the client-side filter. */
function searchText(item) {
  return [item.name, item.category, item.specs.join(' '), item.price, item.availability]
    .join(' ')
    .toLowerCase();
}

/** Categories in display order, each with its filled items and open slots. */
export function buildRows(items, slotsPerCategory = SLOTS_PER_CATEGORY) {
  return CATEGORIES.map(category => {
    const filled = items
      .filter(item => item.categoryId === category.id)
      .map(item => ({ ...item, searchText: searchText(item) }));

    const openCount = Math.max(0, slotsPerCategory - filled.length);
    const open = Array.from({ length: openCount }, (_, index) => {
      const number = filled.length + index + 1;
      return { slot: `${category.prefix}-${String(number).padStart(2, '0')}`, number };
    });

    return { ...category, filled, open, total: Math.max(slotsPerCategory, filled.length) };
  });
}

/** Totals for the "N slots across four categories" label. */
export function slotTotals(rows) {
  return {
    slots: rows.reduce((sum, row) => sum + row.total, 0),
    filled: rows.reduce((sum, row) => sum + row.filled.length, 0),
    categories: rows.length
  };
}
