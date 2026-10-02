// JSON-LD builders. Everything is derived from business.ts and content entries,
// so structured data can never drift from what's printed on the page.
import { business, sameAs } from '../data/business';

const base = business.url;
export const orgId = `${base}/#business`;

export function businessSchema(opts: { logo: string; image?: string }) {
  const b = business;
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
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function serviceSchema(s: { name: string; description: string; url: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    url: s.url,
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
