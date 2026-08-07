import itemsData from '../data/items.json';
import { absoluteUrl, siteOrigin } from '../lib/urls.js';

const CATEGORIES = [
  { id: 'beds', name: 'Beds', subtitle: 'Slatted platforms in maple, oak and ash — no box spring needed' },
  { id: 'chairs', name: 'Chairs', subtitle: 'Sold singly, so a set can be built one chair at a time' },
  { id: 'tables', name: 'Tables', subtitle: 'Hardwax-oiled tops that can be spot-repaired at home' },
  { id: 'sofas', name: 'Sofas', subtitle: 'Oak frames with washable covers you can re-order on their own' }
];

export async function GET(context) {
  const site = siteOrigin(context.site);
  const items = itemsData;

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

  const body = `# Oakline Furniture — LLM Plain Text Knowledge Catalogue

> Solid-wood beds, chairs, tables and sofas made in small batches in Grand Rapids, Michigan. ${items.length} pieces, built to order.

## Store Details
- **Name:** Oakline Furniture
- **Website:** ${site}/
- **Location:** 418 Wealthy Street SE, Grand Rapids, MI 49503
- **Hours:** Tuesday–Saturday, 10am–6pm
- **Phone:** +1 (616) 555-0142
- **Email:** shop@oaklinefurniture.example
- **Craftspeople:** Dana (milling & joining) and Peter (finishing & delivery)
- **Materials:** Hardwood (solid white oak, walnut, maple, cherry, ash) purchased within 200 miles of the shop. Mechanical joinery (mortise, tenon, dovetail).
- **Warranty & Repair:** Repairs on Oakline pieces are free for the first 10 years.
- **Delivery Policy:** Free delivery and assembly within 90 miles. Flat-rate $180 crating anywhere else in the lower 48 US states.

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
