import { beforeEach, describe, expect, it, vi } from 'vitest';

// business.ts fetches Business info from Sanity at import; stand in for that document.
const sanityDoc = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock('../../src/lib/sanity', () => ({ sanity: { fetch: async () => sanityDoc.current } }));

beforeEach(() => {
  vi.resetModules();
  sanityDoc.current = {};
});

describe('telHref', () => {
  it('turns a formatted US number into a dialable tel: link', async () => {
    const { telHref } = await import('../../src/data/business');
    expect(telHref('(336) 399-5500')).toBe('tel:+13363995500');
  });

  it('does not double the country code', async () => {
    const { telHref } = await import('../../src/data/business');
    expect(telHref('1-336-399-5500')).toBe('tel:+13363995500');
    expect(telHref('+1 336 399 5500')).toBe('tel:+13363995500');
  });
});

describe('listJoin', () => {
  it('joins towns the way the site writes lists', async () => {
    const { listJoin } = await import('../../src/data/business');
    expect(listJoin(['Winston-Salem', 'Clemmons', 'Advance'])).toBe('Winston-Salem, Clemmons and Advance');
    expect(listJoin(['Winston-Salem', 'Clemmons'])).toBe('Winston-Salem and Clemmons');
    expect(listJoin(['Winston-Salem'])).toBe('Winston-Salem');
    expect(listJoin([])).toBe('');
  });

  it('builds the service area phrase from Business info', async () => {
    sanityDoc.current = { serviceArea: ['Winston-Salem', 'Clemmons', 'Advance', 'Lewisville', 'Kernersville'] };
    const { serviceAreaText } = await import('../../src/data/business');
    expect(serviceAreaText).toBe('Winston-Salem, Clemmons, Advance, Lewisville and Kernersville');
  });
});

describe('business defaults', () => {
  it('falls back to safe defaults when Business info is empty', async () => {
    const { business, sameAs } = await import('../../src/data/business');
    expect(business.name).toBe('Stansky Construction');
    expect(business.serviceArea).toEqual(['Winston-Salem']);
    expect(business.phone).toBe('');
    expect(business.insured).toBeNull();
    expect(sameAs).toEqual([]);
  });

  it('only lists profile links that are filled in', async () => {
    sanityDoc.current = { instagram: 'https://instagram.com/stansky', google: '' };
    const { sameAs } = await import('../../src/data/business');
    expect(sameAs).toEqual(['https://instagram.com/stansky']);
  });
});

describe('businessSchema', () => {
  it('leaves out fields Jack has not filled in instead of publishing blanks', async () => {
    const { businessSchema } = await import('../../src/lib/schema');
    const schema = businessSchema({ logo: 'https://example.com/logo.png' });
    expect(schema['@type']).toBe('GeneralContractor');
    expect(schema).not.toHaveProperty('telephone');
    expect(schema).not.toHaveProperty('email');
    expect(schema).not.toHaveProperty('sameAs');
  });

  it('includes phone and every service-area town once filled in', async () => {
    sanityDoc.current = { phone: '(336) 399-5500', serviceArea: ['Winston-Salem', 'Clemmons'] };
    const { businessSchema } = await import('../../src/lib/schema');
    const schema = businessSchema({ logo: 'https://example.com/logo.png' });
    expect(schema).toMatchObject({ telephone: '(336) 399-5500' });
    expect(schema.areaServed.map((a) => a.name)).toEqual(['Winston-Salem, NC', 'Clemmons, NC']);
  });
});

describe('openingHours', () => {
  it('reads hours the way Jack types them', async () => {
    const { openingHours } = await import('../../src/lib/schema');
    expect(openingHours('Mon-Fri 8AM-5PM')).toBe('Mo-Fr 08:00-17:00');
    expect(openingHours('Mon–Fri 7am–5pm')).toBe('Mo-Fr 07:00-17:00');
    expect(openingHours('Monday - Saturday 7:30 am - 4:30 pm')).toBe('Mo-Sa 07:30-16:30');
    expect(openingHours('Mon-Fri 8am-12pm')).toBe('Mo-Fr 08:00-12:00');
  });

  it('gives up rather than guess at anything else', async () => {
    const { openingHours } = await import('../../src/lib/schema');
    for (const text of ['', 'By appointment', 'Mon-Fri 8-5', 'Mon-Fri 8AM-5PM, Sat by appointment', 'Mon-Fri 13PM-5PM']) {
      expect(openingHours(text), text).toBeUndefined();
    }
  });

  it('adds hours and the service list to the business details', async () => {
    sanityDoc.current = { hours: 'Mon-Fri 8AM-5PM' };
    const { businessSchema } = await import('../../src/lib/schema');
    const schema = businessSchema({
      logo: 'https://example.com/logo.png',
      services: [{ name: 'Kitchens', url: 'https://stanskyconstruction.com/services/kitchen-remodeling/' }],
    });
    expect(schema).toMatchObject({ openingHours: 'Mo-Fr 08:00-17:00' });
    expect(schema.hasOfferCatalog?.itemListElement[0].itemOffered).toMatchObject({ '@type': 'Service', name: 'Kitchens' });
  });

  it('leaves hours out when they are not set', async () => {
    const { businessSchema } = await import('../../src/lib/schema');
    const schema = businessSchema({ logo: 'https://example.com/logo.png' });
    expect(schema).not.toHaveProperty('openingHours');
    expect(schema).not.toHaveProperty('hasOfferCatalog');
  });
});

describe('projectSchema', () => {
  it('describes a project with its place, service and credited photos', async () => {
    const { projectSchema } = await import('../../src/lib/schema');
    const schema = projectSchema({
      name: 'Front Porch Rebuild',
      description: 'A rebuilt porch.',
      url: 'https://stanskyconstruction.com/portfolio/front-porch-rebuild/',
      place: 'Ardmore, Winston-Salem, NC',
      service: { name: 'Decks & Porches', url: 'https://stanskyconstruction.com/services/decks-and-porches/' },
      photos: [{ src: 'https://cdn.sanity.io/a.jpg', width: 1200, height: 900, alt: 'New porch floor' }],
    });
    expect(schema).toMatchObject({
      '@type': 'CreativeWork',
      contentLocation: { name: 'Ardmore, Winston-Salem, NC' },
      about: { name: 'Decks & Porches' },
    });
    expect(schema.image[0]).toMatchObject({ contentUrl: 'https://cdn.sanity.io/a.jpg', caption: 'New porch floor', creditText: 'Stansky Construction' });
  });

  it('leaves out place and service when a project has none', async () => {
    const { projectSchema } = await import('../../src/lib/schema');
    const schema = projectSchema({ name: 'Deck', description: 'A deck.', url: 'https://example.com/', photos: [] });
    expect(schema).not.toHaveProperty('contentLocation');
    expect(schema).not.toHaveProperty('about');
  });
});

describe('serviceSchema', () => {
  it('names the trade when one is known', async () => {
    const { serviceSchema } = await import('../../src/lib/schema');
    const schema = serviceSchema({ name: 'Decks & Porches', description: 'Decks.', url: 'https://example.com/', serviceType: 'Deck and porch builder' });
    expect(schema).toMatchObject({ '@type': 'Service', serviceType: 'Deck and porch builder' });
  });

  it('leaves the trade out when there is none', async () => {
    const { serviceSchema } = await import('../../src/lib/schema');
    expect(serviceSchema({ name: 'Decks', description: 'Decks.', url: 'https://example.com/' })).not.toHaveProperty('serviceType');
  });
});
