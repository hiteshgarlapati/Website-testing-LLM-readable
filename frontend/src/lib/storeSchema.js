/**
 * Single source for the FurnitureStore LocalBusiness node.
 *
 * This node was previously duplicated verbatim in Layout.astro and index.astro,
 * which is how `priceRange` drifted out of date in one copy without the other
 * noticing. Both now build from here, and every locality-bearing value comes
 * from business.js so the schema cannot disagree with the visible copy.
 */

import {
  BUSINESS,
  contactEmail,
  contactPhone,
  postalAddressSchema,
  placeLabel
} from './business.js';

/** Fallback for pages that do not load the catalogue. Keep in step with the data. */
export const DEFAULT_PRICE_RANGE = '₹8,750-₹85,500';

/** Flat crating charge in rupees, emitted as Offer.shippingDetails. */
export const SHIPPING_RATE = BUSINESS.shippingRateInr;

/**
 * Schema.org priceRange derived from real catalogue data rather than hand-typed,
 * so it cannot go stale the way the previous "$340-$3,240" did.
 */
export function catalogPriceRange(items) {
  const prices = items.map(item => item.price).filter(n => Number.isFinite(n));
  if (!prices.length) return DEFAULT_PRICE_RANGE;
  const money = n => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);
  return `${money(Math.min(...prices))}-${money(Math.max(...prices))}`;
}

/**
 * WebSite node carrying a SearchAction, which is what makes a sitelinks search
 * box eligible. The target must be a real, crawlable query URL — /browse?q=
 * filters server-rendered markup, so a crawler following it sees results.
 */
export function buildWebSiteSchema(site) {
  return {
    "@type": "WebSite",
    "@id": `${site}/#website`,
    "name": BUSINESS.name,
    "url": `${site}/`,
    "inLanguage": "en-IN",
    "publisher": { "@id": `${site}/#store` },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${site}/browse?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildStoreSchema(site, { priceRange = DEFAULT_PRICE_RANGE } = {}) {
  const schema = {
    "@type": "FurnitureStore",
    "@id": `${site}/#store`,
    "name": BUSINESS.name,
    "description": `Solid-wood beds, chairs, tables and sofas made in small batches in ${placeLabel()}, built to order.`,
    "url": `${site}/`,
    "priceRange": priceRange,
    "currenciesAccepted": "INR",
    // The string form stays for older consumers; the specification form is what
    // lets an assistant answer "are they open on Sunday?" without parsing prose.
    "openingHours": BUSINESS.openingHours,
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "https://schema.org/Tuesday",
          "https://schema.org/Wednesday",
          "https://schema.org/Thursday",
          "https://schema.org/Friday",
          "https://schema.org/Saturday"
        ],
        "opens": "10:00",
        "closes": "18:00"
      }
    ]
  };

  // Everything below is omitted rather than guessed while business.js still
  // holds placeholders — an absent property is honest, a fabricated one is not.
  const phone = contactPhone();
  if (phone) schema.telephone = phone;

  const email = contactEmail();
  if (email) schema.email = email;

  const address = postalAddressSchema();
  if (address) schema.address = address;

  if (BUSINESS.geo) {
    schema.geo = {
      "@type": "GeoCoordinates",
      "latitude": BUSINESS.geo.latitude,
      "longitude": BUSINESS.geo.longitude
    };
  }

  return schema;
}
