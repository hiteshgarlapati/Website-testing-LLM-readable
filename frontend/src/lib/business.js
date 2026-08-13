/**
 * Single source of truth for who and where this business is.
 *
 * The site was built around a US storefront (Grand Rapids, Michigan; USD; the
 * lower 48). The market is now India, so every locality-bearing fact lives here
 * rather than scattered through prose, schema and llms.txt — that scattering is
 * what let the address, currency and shipping country drift apart in the first
 * place.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠ THESE ARE DEMO VALUES. THIS IS NOT A REAL BUSINESS ADDRESS.
 *
 * quillovan.com is a test site, so the fields below are filled with the
 * illustrative values this file already carried in its own comments — a fake
 * street on a real city, so the SEO plumbing (LocalBusiness JSON-LD, the footer
 * contact block, the order buttons on every product page) can be exercised
 * end to end instead of silently rendering empty.
 *
 * REPLACE ALL OF THEM BEFORE TAKING A SINGLE REAL ORDER. A fabricated address
 * or phone number in structured data is not a harmless placeholder once a site
 * is indexed: Google cross-checks it against your Business Profile and
 * third-party directories, mismatches suppress local ranking, and it is a
 * common trigger for profile suspension. A stranger also answers a phone
 * number you did not verify.
 *
 * The omit-rather-than-guess machinery below is intact. Setting any field back
 * to REPLACE_ME drops it from JSON-LD instead of emitting something false, and
 * visible copy degrades to a generic phrasing ("across India") rather than
 * naming a city that isn't yours.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PLACEHOLDER = 'REPLACE_ME';

/** True when a field holds a real value rather than the placeholder token. */
export const isSet = value => Boolean(value) && value !== PLACEHOLDER;

/**
 * Discoverability canary.
 *
 * A string chosen to exist nowhere else on the web, embedded as visible text
 * (footer), machine-readable metadata (<meta>) and plain text (llms.txt). It
 * separates two failure modes that otherwise look identical when an assistant
 * cannot find this site:
 *
 *   • searching the canary returns nothing  → the site is not indexed at all
 *   • canary found, brand name not          → indexed, but name matching failed
 *
 * Do not reuse this string anywhere else, and do not change it once the site is
 * submitted — the whole value is that exactly one document on the web has it.
 */
export const SITE_CANARY = 'quillovan-canary-4d7f2b91';

export const BUSINESS = {
  name: 'Quillovan Furniture',
  foundedYear: 2014,

  // --- Physical location (DEMO — not a real address) --------------------------
  // "Example Street" is deliberately not a real street: a plausible-looking one
  // would eventually be somebody's actual building.
  streetAddress: '1 Example Street, Indiranagar',
  addressLocality: 'Bengaluru',
  addressRegion: 'Karnataka',
  postalCode: '560038',
  addressCountry: 'IN',

  // --- Contact (DEMO) --------------------------------------------------------
  // Email is on the domain this site already owns, so the mailto: buttons on
  // product pages resolve somewhere harmless.
  //
  // Phone stays unset on purpose. Every Indian landline pattern that looks
  // realistic enough to be worth testing with is one a real person may answer,
  // and the site publishes it as a tel: link on all 103 product pages. The
  // email CTA alone proves the same code path. Set a number you actually
  // control if you want the phone button rendered.
  telephone: PLACEHOLDER,       // E.164 preferred, e.g. '+91-80-4000-1234'
  email: 'shop@quillovan.com',

  // --- Map pin (DEMO) --------------------------------------------------------
  // The Bengaluru city centroid, not a building. An assistant answering
  // "furniture shops near me" trusts this literally, so on a real launch it
  // must come from your Google Business Profile or go back to null — a guessed
  // coordinate is worse than no coordinate.
  geo: { latitude: 12.9716, longitude: 77.5946 },

  // --- Trading terms ---------------------------------------------------------
  openingHours: 'Tu-Sa 10:00-18:00',
  deliveryRadiusKm: 50,         // free delivery + assembly inside this radius
  sourcingRadiusKm: 300,        // timber sourcing radius quoted in the copy
  shippingRateInr: 1800         // flat crating charge outside the radius
};

/** Rupee amount formatted the Indian way (₹1,80,000 rather than ₹180,000). */
export function formatInr(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

/** City name, or null while unset. */
export const city = () => (isSet(BUSINESS.addressLocality) ? BUSINESS.addressLocality : null);

/** "Bengaluru, Karnataka" → falls back to "India" until the city is filled in. */
export function placeLabel() {
  const parts = [city(), isSet(BUSINESS.addressRegion) ? BUSINESS.addressRegion : null].filter(Boolean);
  return parts.length ? parts.join(', ') : 'India';
}

/** "our Bengaluru workshop" → "our workshop" while unset. */
export function workshopLabel() {
  return city() ? `our ${city()} workshop` : 'our workshop';
}

/** Address lines for visible contact blocks; empty while unset. */
export function addressLines() {
  const street = isSet(BUSINESS.streetAddress) ? BUSINESS.streetAddress : null;
  const locality = [city(), isSet(BUSINESS.addressRegion) ? BUSINESS.addressRegion : null]
    .filter(Boolean)
    .join(', ');
  const withPin = isSet(BUSINESS.postalCode) ? `${locality} ${BUSINESS.postalCode}`.trim() : locality;
  return [street, withPin || null].filter(Boolean);
}

/** One sentence covering free-radius delivery and the flat crating charge. */
export function deliveryPolicy() {
  const where = city() ? `of ${city()}` : 'of the workshop';
  return `Free delivery and assembly within ${BUSINESS.deliveryRadiusKm} km ${where}. Flat-rate ${formatInr(BUSINESS.shippingRateInr)} crating anywhere else in India.`;
}

/** Timber sourcing phrase used in the About copy and llms.txt. */
export function sourcingPolicy() {
  return `purchased within ${BUSINESS.sourcingRadiusKm} km of the shop`;
}

/** Contact values, or null when still placeholders, so templates can omit links. */
export const contactPhone = () => (isSet(BUSINESS.telephone) ? BUSINESS.telephone : null);
export const contactEmail = () => (isSet(BUSINESS.email) ? BUSINESS.email : null);

/** `tel:` href needs the number stripped of spaces and dashes. */
export const telHref = () => {
  const phone = contactPhone();
  return phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null;
};

/**
 * PostalAddress for JSON-LD, carrying only fields that hold real values.
 * Returns null when nothing but the country is known — an address node with a
 * country and nothing else is noise to a consumer.
 */
export function postalAddressSchema() {
  const address = { "@type": "PostalAddress", "addressCountry": BUSINESS.addressCountry };
  if (isSet(BUSINESS.streetAddress)) address.streetAddress = BUSINESS.streetAddress;
  if (isSet(BUSINESS.addressLocality)) address.addressLocality = BUSINESS.addressLocality;
  if (isSet(BUSINESS.addressRegion)) address.addressRegion = BUSINESS.addressRegion;
  if (isSet(BUSINESS.postalCode)) address.postalCode = BUSINESS.postalCode;
  return Object.keys(address).length > 2 ? address : null;
}

/** Fields still needing real values; empty array means ready to deploy. */
export function unresolvedFields() {
  const pending = Object.entries(BUSINESS)
    .filter(([, value]) => value === PLACEHOLDER)
    .map(([key]) => key);
  if (!BUSINESS.geo) pending.push('geo');
  return pending;
}
