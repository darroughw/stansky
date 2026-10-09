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
