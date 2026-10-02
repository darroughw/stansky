// Single source of truth for name / phone / service area (NAP).
// These values must match Google Business Profile, Angi, HomeAdvisor and Instagram exactly.
// Will become the Sanity "Business info" singleton; empty strings are hidden on the site
// and reported as warnings at build time (see src/lib/checks.ts).

export const business = {
  name: 'Stansky Construction',
  legalName: '', // TODO: exact registered name, e.g. "Stansky Construction LLC"
  owner: 'Jack Stansky',
  url: 'https://stanskyconstruction.com',
  phone: '', // TODO: display format, e.g. "(336) 555-0123"
  email: '', // TODO
  city: 'Winston-Salem',
  region: 'NC',
  postalCode: '', // TODO: optional; only if Jack wants it public
  // Towns Jack actually takes work in. Clemmons comes from the current portfolio.
  serviceArea: ['Winston-Salem', 'Clemmons'], // TODO: confirm and extend (Kernersville, Lewisville, Pfafftown, ...)
  licenseNumber: '', // TODO: NC general contractor license #, if licensed
  insured: null as boolean | null, // TODO: true once confirmed
  foundedYear: null as number | null, // TODO
  hours: '', // TODO, e.g. "Mon–Fri 7am–5pm"
  verse: {
    text: 'Whatever you do, work at it with all your heart, as working for the Lord and not for man.',
    cite: 'Colossians 3:23',
  },
  social: {
    instagram: 'https://www.instagram.com/stanskyconstruction/',
    angi: '', // TODO: profile URL
    homeAdvisor: '', // TODO: profile URL
    google: '', // TODO: Google Business Profile URL
  },
} as const;

export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;

export const sameAs = Object.values(business.social).filter(Boolean);
