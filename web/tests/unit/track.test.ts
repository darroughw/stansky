// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// track.ts does its work on import, so each test sets up the page and then loads it fresh.
const listeners: [string, EventListenerOrEventListenerObject][] = [];
const trackers = { posthog: vi.fn(), fbq: vi.fn(), ndp: vi.fn(), gtag: vi.fn() };

const FORM = `
  <form name="estimate">
    <input type="hidden" name="lead_source" value="" />
    <input name="name" value="Pat" />
    <input name="email" value="pat@example.com" />
    <input name="town" value="Clemmons" />
    <select name="project"><option selected>Kitchens</option></select>
    <textarea name="message">New counters</textarea>
  </form>`;

function visit(path: string, { html = '', referrer = '' } = {}) {
  history.replaceState(null, '', path);
  document.body.innerHTML = html;
  Object.defineProperty(document, 'referrer', { value: referrer, configurable: true });
}

async function loadTracker() {
  vi.resetModules();
  await import('../../src/lib/track');
}

// happy-dom follows tel:/mailto: links on click; a real browser hands them to the OS.
const tap = (el: Element) => {
  el.closest('a')!.addEventListener('click', (e) => e.preventDefault(), { once: true });
  (el as HTMLElement).click();
};

const leadSource = () => document.querySelector<HTMLInputElement>('input[name="lead_source"]')!.value;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.values(trackers).forEach((t) => t.mockReset());
  window.posthog = { capture: trackers.posthog };
  window.fbq = trackers.fbq;
  window.ndp = trackers.ndp;
  window.gtag = trackers.gtag;
  const add = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
    listeners.push([type, fn]);
    add(type, fn, opts);
  });
});

afterEach(() => {
  for (const [type, fn] of listeners.splice(0)) document.removeEventListener(type, fn);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('lead source on the estimate form', () => {
  it('describes a tagged ad click in plain words', async () => {
    visit('/services/kitchens/?utm_source=facebook&utm_medium=paid&utm_campaign=kitchens-fall&utm_content=video1');
    await loadTracker();
    visit('/contact/', { html: FORM });
    await loadTracker();
    expect(leadSource()).toBe('facebook / paid, campaign: kitchens-fall, ad: video1, landed on /services/kitchens/');
  });

  it('names the platform from a click ID when the ad has no UTM tags', async () => {
    visit('/?gclid=abc123');
    await loadTracker();
    visit('/contact/', { html: FORM });
    await loadTracker();
    expect(leadSource()).toBe('google, landed on /');
  });

  it('records the referring site for unpaid visits', async () => {
    visit('/portfolio/', { referrer: 'https://www.houzz.com/some/page' });
    await loadTracker();
    visit('/contact/', { html: FORM, referrer: `${location.origin}/portfolio/` });
    await loadTracker();
    expect(leadSource()).toBe('www.houzz.com, landed on /portfolio/');
  });

  it('keeps the original source while the visitor browses around the site', async () => {
    visit('/?utm_source=nextdoor&utm_campaign=decks');
    await loadTracker();
    visit('/portfolio/', { referrer: 'https://www.google.com/' });
    await loadTracker();
    visit('/contact/', { html: FORM });
    await loadTracker();
    expect(leadSource()).toBe('nextdoor, campaign: decks, landed on /');
  });

  it('gives a newer ad click the credit', async () => {
    visit('/?utm_source=nextdoor');
    await loadTracker();
    visit('/services/?utm_source=facebook&utm_campaign=baths');
    await loadTracker();
    visit('/contact/', { html: FORM });
    await loadTracker();
    expect(leadSource()).toBe('facebook, campaign: baths, landed on /services/');
  });

  it('still works when storage is blocked', async () => {
    // Safari private mode and blocked site data make the storage accessors themselves throw.
    const blocked = { get: () => { throw new DOMException('blocked', 'SecurityError'); }, configurable: true };
    const originals = ['localStorage', 'sessionStorage'].map((k) => [k, Object.getOwnPropertyDescriptor(window, k)] as const);
    Object.defineProperty(window, 'localStorage', blocked);
    Object.defineProperty(window, 'sessionStorage', blocked);
    try {
      visit('/contact/?utm_source=facebook', { html: FORM });
      await expect(loadTracker()).resolves.toBeUndefined();
      expect(leadSource()).toBe('Direct visit');
    } finally {
      for (const [k, d] of originals) Object.defineProperty(window, k, d!);
    }
  });
});

describe('estimate funnel events', () => {
  it('reports the first interaction with the form once', async () => {
    visit('/contact/', { html: FORM });
    await loadTracker();
    const field = document.querySelector<HTMLInputElement>('input[name="name"]')!;
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(trackers.posthog.mock.calls.filter(([e]) => e === 'estimate_form_started')).toHaveLength(1);
  });

  it('fires the lead conversion on every platform after a real submit', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_ADS_ID', 'AW-999');
    vi.stubEnv('PUBLIC_GOOGLE_ADS_LEAD_LABEL', 'leadlbl');
    visit('/contact/', { html: FORM });
    await loadTracker();
    document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    visit('/contact/thanks/');
    await loadTracker();
    expect(trackers.posthog).toHaveBeenCalledWith('estimate_submitted', { project: 'Kitchens', town: 'Clemmons' });
    expect(trackers.fbq).toHaveBeenCalledWith('track', 'Lead', { content_name: 'Kitchens' });
    expect(trackers.ndp).toHaveBeenCalledWith('track', 'LEAD');
    expect(trackers.gtag).toHaveBeenCalledWith('event', 'conversion', { send_to: 'AW-999/leadlbl' });
  });

  it('never sends the name, email or message to a tracker', async () => {
    visit('/contact/', { html: FORM });
    await loadTracker();
    document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    visit('/contact/thanks/');
    await loadTracker();
    const sent = JSON.stringify(Object.values(trackers).flatMap((t) => t.mock.calls));
    expect(sent).not.toContain('Pat');
    expect(sent).not.toContain('pat@example.com');
    expect(sent).not.toContain('New counters');
  });

  it('does not count a reload of the thanks page as a second lead', async () => {
    visit('/contact/', { html: FORM });
    await loadTracker();
    document.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    visit('/contact/thanks/');
    await loadTracker();
    await loadTracker();
    expect(trackers.fbq.mock.calls.filter(([, e]) => e === 'Lead')).toHaveLength(1);
  });

  it('does not count a direct visit to the thanks page', async () => {
    visit('/contact/thanks/');
    await loadTracker();
    expect(trackers.posthog).not.toHaveBeenCalled();
    expect(trackers.fbq).not.toHaveBeenCalled();
    expect(trackers.ndp).not.toHaveBeenCalled();
  });
});

describe('contact link taps', () => {
  it('reports phone taps with where on the page they happened', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_ADS_ID', 'AW-999');
    vi.stubEnv('PUBLIC_GOOGLE_ADS_CALL_LABEL', 'calllbl');
    visit('/services/', { html: '<header><a href="tel:+13363995500"><span>Call</span></a></header>' });
    await loadTracker();
    tap(document.querySelector('span')!);
    expect(trackers.posthog).toHaveBeenCalledWith('phone_clicked', { page: '/services/', placement: 'header' });
    expect(trackers.fbq).toHaveBeenCalledWith('track', 'Contact');
    expect(trackers.gtag).toHaveBeenCalledWith('event', 'conversion', { send_to: 'AW-999/calllbl' });
  });

  it('reports email taps without a Google Ads call conversion', async () => {
    vi.stubEnv('PUBLIC_GOOGLE_ADS_ID', 'AW-999');
    vi.stubEnv('PUBLIC_GOOGLE_ADS_CALL_LABEL', 'calllbl');
    visit('/', { html: '<footer><a href="mailto:hi@example.com">Email</a></footer>' });
    await loadTracker();
    tap(document.querySelector('a')!);
    expect(trackers.posthog).toHaveBeenCalledWith('email_clicked', { page: '/', placement: 'footer' });
    expect(trackers.gtag).not.toHaveBeenCalled();
  });

  it('ignores ordinary links', async () => {
    visit('/', { html: '<main><a href="/portfolio/">Our work</a></main>' });
    await loadTracker();
    document.querySelector('a')!.click();
    expect(trackers.posthog).not.toHaveBeenCalled();
  });

  it('keeps working when no trackers loaded', async () => {
    delete window.posthog;
    delete window.fbq;
    delete window.ndp;
    delete window.gtag;
    visit('/', { html: '<header><a href="tel:+13363995500">Call</a></header>' });
    await loadTracker();
    expect(() => tap(document.querySelector('a')!)).not.toThrow();
  });
});
