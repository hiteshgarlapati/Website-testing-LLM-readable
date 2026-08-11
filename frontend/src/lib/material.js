/**
 * Material and colour derived from the copy that already exists on each item.
 *
 * Every item in items.json ships an empty `specs` array, so the Product schema
 * fell back to the literal string "Solid wood" for all 103 pieces — including
 * the velvet loveseats and the tempered-glass console tables. That is worse
 * than useless to a shopping crawler.
 *
 * IMPORTANT: this only ever *extracts* from text the item already carries. It
 * never infers a material that the name and description do not state. An item
 * whose copy names no material yields null, and the caller omits the property
 * rather than asserting a guess. Dimensions are deliberately absent — no
 * measurement exists anywhere in the dataset, and inventing one would put a
 * false specification in front of buyers.
 */

/**
 * Ordered longest-phrase-first so "top-grain leather" wins over "leather" and
 * "solid oak" over "oak". Each entry maps a phrase to its canonical label.
 */
const MATERIALS = [
  ['top-grain leather', 'Top-grain leather'],
  ['genuine leather', 'Genuine leather'],
  ['faux leather', 'Faux leather'],
  ['bonded leather', 'Bonded leather'],
  ['distressed leather', 'Distressed leather'],
  ['leather', 'Leather'],
  ['belgian linen', 'Belgian linen'],
  ['linen blend', 'Linen blend'],
  ['linen', 'Linen'],
  ['boucle', 'Bouclé'],
  ['velvet', 'Velvet'],
  ['chenille', 'Chenille'],
  ['corduroy', 'Corduroy'],
  ['micro-suede', 'Micro-suede'],
  ['performance fabric', 'Performance fabric'],
  ['cotton', 'Cotton'],
  ['rattan', 'Rattan'],
  ['wicker', 'Wicker'],
  ['bamboo', 'Bamboo'],
  ['tempered glass', 'Tempered glass'],
  ['glass', 'Glass'],
  ['solid walnut', 'Solid walnut'],
  ['walnut', 'Walnut'],
  ['solid oak', 'Solid oak'],
  ['white oak', 'White oak'],
  ['oak', 'Oak'],
  ['mahogany', 'Mahogany'],
  ['teak', 'Teak'],
  ['acacia', 'Acacia'],
  ['cherry', 'Cherry'],
  ['maple', 'Maple'],
  ['beech', 'Beech'],
  ['pine', 'Pine'],
  ['ash', 'Ash'],
  ['reclaimed timber', 'Reclaimed timber'],
  ['hardwood', 'Hardwood'],
  ['solid wood', 'Solid wood'],
  ['brass', 'Brass'],
  ['bronze', 'Bronze'],
  ['chrome', 'Chrome'],
  ['stainless steel', 'Stainless steel'],
  ['steel', 'Steel'],
  ['iron', 'Iron'],
  ['aluminum', 'Aluminium'],
  ['aluminium', 'Aluminium'],
  ['metal', 'Metal'],
  ['resin wicker', 'Resin wicker'],
  ['molded resin', 'Moulded resin'],
  ['resin', 'Resin'],
  ['textilene mesh', 'Textilene mesh'],
  ['mesh', 'Mesh'],
  ['plastic', 'Plastic'],
  ['granite', 'Granite'],
  ['marble', 'Marble'],
  ['concrete', 'Concrete'],
  ['birch', 'Birch'],
  ['plywood', 'Plywood'],
  // Generic catch-alls last, so a specific species or weave always wins.
  ['timber', 'Timber'],
  ['wooden', 'Wood'],
  ['wood', 'Wood'],
  ['knitted fabric', 'Knitted fabric'],
  ['fabric', 'Fabric']
];

const COLOURS = [
  ['charcoal grey', 'Charcoal grey'],
  ['silver-grey', 'Silver grey'],
  ['light grey', 'Light grey'],
  ['dark grey', 'Dark grey'],
  ['heather grey', 'Heather grey'],
  ['grey', 'Grey'],
  ['emerald green', 'Emerald green'],
  ['olive green', 'Olive green'],
  ['navy blue', 'Navy blue'],
  ['royal blue', 'Royal blue'],
  ['sky blue', 'Sky blue'],
  ['light blue', 'Light blue'],
  ['burgundy', 'Burgundy'],
  ['terracotta', 'Terracotta'],
  ['off-white', 'Off-white'],
  ['whitewashed', 'Whitewashed'],
  ['cream', 'Cream'],
  ['beige', 'Beige'],
  ['tan', 'Tan'],
  ['cognac', 'Cognac'],
  ['black', 'Black'],
  ['white', 'White'],
  ['brown', 'Brown'],
  ['blue', 'Blue'],
  ['green', 'Green'],
  ['orange', 'Orange'],
  ['red', 'Red']
];

/** Item text searched for material and colour terms. */
function haystack(item) {
  return [item?.name, item?.description, ...(item?.specs ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * Whole-word matching, cached per phrase. A plain substring test would read
 * "ash" out of "whitewashed" and "tan" out of "rectangular", labelling pieces
 * with materials their copy never mentions.
 */
const patterns = new Map();
function mentions(text, phrase) {
  let pattern = patterns.get(phrase);
  if (!pattern) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    pattern = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, 'i');
    patterns.set(phrase, pattern);
  }
  return pattern.test(text);
}

function firstMatch(text, table) {
  for (const [needle, label] of table) {
    if (mentions(text, needle)) return label;
  }
  return null;
}

/** Primary material stated in the item's own copy, or null when none is. */
export function primaryMaterial(item) {
  const explicit = item?.specs?.[0];
  if (explicit) return explicit;
  return firstMatch(haystack(item), MATERIALS);
}

/** Every distinct material the copy names, most specific first. */
export function allMaterials(item) {
  const text = haystack(item);
  const found = [];
  for (const [needle, label] of MATERIALS) {
    if (mentions(text, needle) && !found.includes(label)) found.push(label);
  }
  return found;
}

/** Dominant colour stated in the copy, or null. */
export function primaryColour(item) {
  return firstMatch(haystack(item), COLOURS);
}

/**
 * Descriptive alt text: the product name plus the material and colour the copy
 * already states, so image search gets "…, cream bouclé" rather than a bare
 * repeat of the heading beside it. Falls back to the name alone.
 */
export function imageAlt(item) {
  if (!item?.name) return '';
  const colour = primaryColour(item);
  const material = primaryMaterial(item);
  const qualifiers = [colour, material ? material.toLowerCase() : null].filter(Boolean).join(' ');
  return qualifiers ? `${item.name} — ${qualifiers}` : item.name;
}
