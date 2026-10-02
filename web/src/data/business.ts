// Name / phone / service area (NAP), edited in Sanity under "Business info".
// Fetched once per build. Empty values are hidden on the site and reported
// as warnings at build time (see src/lib/checks.ts).
import { sanity } from '../lib/sanity';

type BusinessDoc = {
  name?: string;
  legalName?: string;
  owner?: string;
  phone?: string;
  email?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  serviceArea?: string[];
  hours?: string;
  licenseNumber?: string;
  insured?: boolean;
  foundedYear?: number;
  instagram?: string;
  google?: string;
  angi?: string;
  homeAdvisor?: string;
};

const doc: BusinessDoc = (await sanity.fetch(`*[_id == "business"][0]`)) ?? {};

export const business = {
  name: doc.name ?? 'Stansky Construction',
  legalName: doc.legalName ?? '',
  owner: doc.owner ?? 'Jack Stansky',
  url: 'https://stanskyconstruction.com',
  phone: doc.phone ?? '',
  email: doc.email ?? '',
  city: doc.city ?? 'Winston-Salem',
  region: doc.region ?? 'NC',
  postalCode: doc.postalCode ?? '',
  serviceArea: doc.serviceArea?.length ? doc.serviceArea : ['Winston-Salem'],
  licenseNumber: doc.licenseNumber ?? '',
  insured: doc.insured ?? null,
  foundedYear: doc.foundedYear ?? null,
  hours: doc.hours ?? '',
  // Brand content, not something Jack edits.
  verse: {
    text: 'Whatever you do, work at it with all your heart, as working for the Lord and not for man.',
    cite: 'Colossians 3:23',
  },
  social: {
    instagram: doc.instagram ?? '',
    angi: doc.angi ?? '',
    homeAdvisor: doc.homeAdvisor ?? '',
    google: doc.google ?? '',
  },
};

export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;

export const sameAs = Object.values(business.social).filter(Boolean);
