// JSON-LD builders. Everything is derived from business.ts and content entries,
// so structured data can never drift from what's printed on the page.
import { business, sameAs } from '../data/business';

const base = business.url;
export const orgId = `${base}/#business`;

const DAYS: Record<string, string> = { mon: 'Mo', tue: 'Tu', wed: 'We', thu: 'Th', fri: 'Fr', sat: 'Sa', sun: 'Su' };

/**
 * Turns hours typed the way Jack writes them ("Mon-Fri 8AM-5PM") into schema.org's
 * format ("Mo-Fr 08:00-17:00"). Returns undefined for anything it can't read with
 * certainty, so a free-form note never becomes wrong hours in Google.
 */
export function openingHours(text: string): string | undefined {
  const m = text
    .trim()
    .match(/^([a-z]{3})[a-z]*\s*[-–]\s*([a-z]{3})[a-z]*,?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!m) return undefined;
  const [, from, to, h1, m1 = '00', ap1, h2, m2 = '00', ap2] = m;
  const days = [DAYS[from.toLowerCase()], DAYS[to.toLowerCase()]];
  const hours = [h1, h2].map(Number);
  if (days.includes(undefined as never) || hours.some((h) => h < 1 || h > 12)) return undefined;
  const time = (h: number, min: string, ap: string) =>
    `${String((h % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0)).padStart(2, '0')}:${min}`;
  return `${days[0]}-${days[1]} ${time(hours[0], m1, ap1)}-${time(hours[1], m2, ap2)}`;
}

export function businessSchema(opts: { logo: string; image?: string; services?: { name: string; url: string }[] }) {
  const b = business;
  const hours = openingHours(b.hours);
  return {
    '@context': 'https://schema.org',
    '@type': 'GeneralContractor',
    '@id': orgId,
    name: b.name,
    ...(b.legalName ? { legalName: b.legalName } : {}),
    url: `${base}/`,
    logo: opts.logo,
    ...(opts.image ? { image: opts.image } : {}),
    ...(b.phone ? { telephone: b.phone } : {}),
    ...(b.email ? { email: b.email } : {}),
    founder: { '@type': 'Person', name: b.owner },
    ...(b.foundedYear ? { foundingDate: String(b.foundedYear) } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: b.city,
      addressRegion: b.region,
      ...(b.postalCode ? { postalCode: b.postalCode } : {}),
      addressCountry: 'US',
    },
    areaServed: b.serviceArea.map((name) => ({
      '@type': 'City',
      name: `${name}, ${b.region}`,
    })),
    ...(hours ? { openingHours: hours } : {}),
    ...(opts.services?.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Services',
            itemListElement: opts.services.map((s) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: s.name, url: s.url },
            })),
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Tells search engines the site's name (shown above results) and who publishes it. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    name: business.name,
    url: `${base}/`,
    publisher: { '@id': orgId },
  };
}

/** A finished job: what it was, where, which service, and its photos credited to the business. */
export function projectSchema(p: {
  name: string;
  description: string;
  url: string;
  place?: string;
  service?: { name: string; url: string };
  photos: { src: string; width: number; height: number; alt: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.name,
    description: p.description,
    url: p.url,
    creator: { '@id': orgId },
    ...(p.place ? { contentLocation: { '@type': 'Place', name: p.place } } : {}),
    ...(p.service ? { about: { '@type': 'Service', name: p.service.name, url: p.service.url } } : {}),
    image: p.photos.map((photo) => ({
      '@type': 'ImageObject',
      contentUrl: photo.src,
      width: photo.width,
      height: photo.height,
      caption: photo.alt,
      creator: { '@id': orgId },
      creditText: business.name,
    })),
  };
}

export function projectListSchema(projects: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${business.name} projects`,
    itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: p.url })),
  };
}

export function serviceSchema(s: { name: string; description: string; url: string; serviceType?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    url: s.url,
    ...(s.serviceType ? { serviceType: s.serviceType } : {}),
    provider: { '@id': orgId },
    areaServed: business.serviceArea.map((name) => `${name}, ${business.region}`),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
