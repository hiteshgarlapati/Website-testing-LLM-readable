import { readItems } from '../lib/itemsStore.js';
import { absoluteUrl, siteOrigin } from '../lib/urls.js';
import { publishableItems } from '../lib/publishable.js';
import {
  BUSINESS,
  SITE_CANARY,
  addressLines,
  contactEmail,
  contactPhone,
  deliveryPolicy,
  placeLabel,
  sourcingPolicy
} from '../lib/business.js';

export const prerender = false;

const CATEGORIES = [
  { id: 'beds', name: 'Beds', subtitle: 'Slatted platforms in maple, oak and ash — no box spring needed' },
  { id: 'chairs', name: 'Chairs', subtitle: 'Sold singly, so a set can be built one chair at a time' },
  { id: 'tables', name: 'Tables', subtitle: 'Hardwax-oiled tops that can be spot-repaired at home' },
  { id: 'sofas', name: 'Sofas', subtitle: 'Oak frames with washable covers you can re-order on their own' }
];

export async function GET(context) {
  const site = siteOrigin(context.site);
  const itemsData = await readItems();
  const items = publishableItems(itemsData);

  // Numbering runs across the whole catalogue, not per category, so the list
  // reads the same way the old hand-written file did.
  let n = 0;
  const sections = CATEGORIES.map(cat => {
    const inCategory = items.filter(item => item.categoryId === cat.id);
    if (inCategory.length === 0) return null;

    const entries = inCategory.map(item => {
      n += 1;
      return [
        `${n}. **${item.name}**`,
        `   - **Price:** ${item.formattedPrice}`,
        `   - **Availability:** ${item.availability}`,
        `   - **Specs:** ${item.specs.join(', ')}`,
        `   - **Description:** ${item.description}`,
        `   - **Image:** ${absoluteUrl(site, item.image)}`,
        `   - **URL:** ${site}/product/${item.slug}`
      ].join('\n');
    });

    return `### ${cat.name} (${cat.subtitle})\n\n${entries.join('\n\n')}`;
  }).filter(Boolean);

  // Contact and address lines are omitted rather than guessed while business.js
  // still holds placeholders, so this file never states a fact the site cannot back.
  const storeDetails = [
    `- **Name:** ${BUSINESS.name}`,
    `- **Website:** ${site}/`,
    addressLines().length ? `- **Location:** ${addressLines().join(', ')}` : null,
    `- **Country:** India`,
    `- **Currency:** INR (₹)`,
    `- **Hours:** Tuesday–Saturday, 10am–6pm`,
    contactPhone() ? `- **Phone:** ${contactPhone()}` : null,
    contactEmail() ? `- **Email:** ${contactEmail()}` : null,
    `- **Craftspeople:** Dana (milling & joining) and Peter (finishing & delivery)`,
    `- **Materials:** Hardwood (solid white oak, walnut, maple, cherry, ash) ${sourcingPolicy()}. Mechanical joinery (mortise, tenon, dovetail).`,
    `- **Warranty & Repair:** Repairs on Quillovan pieces are free for the first 10 years.`,
    `- **Delivery Policy:** ${deliveryPolicy()}`
  ].filter(Boolean).join('\n');

  const body = `# Quillovan Furniture — LLM Plain Text Knowledge Catalogue

> Solid-wood beds, chairs, tables and sofas made in small batches in ${placeLabel()}. ${items.length} pieces, built to order. Prices in Indian rupees (INR).

## Store Details
${storeDetails}

## Site Reference
- **Canary:** ${SITE_CANARY}

## Machine-Readable Endpoints
- **Browse all products:** ${site}/browse
- **Product JSON API:** ${site}/products.json
- **Sitemap:** ${site}/sitemap.xml
- **Structured data:** Schema.org JSON-LD (Product, Offer, FurnitureStore, FAQPage) is embedded in every page.

---

## Catalogue (${items.length} Items Across ${sections.length} Categories)

${sections.join('\n\n')}
`;

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });
}
