// Runs in the browser, only when at least one tracker is configured (see analytics.ts).
// Sends the same few events to whichever trackers loaded:
//
//   estimate_form_started  first interaction with the estimate form
//   estimate_submitted     the thanks page after a real submit (Lead conversion for ads)
//   phone_clicked          any tap on a tel: link (Contact for ads; calls are most leads)
//   email_clicked          any mailto: link
//
// It also remembers where a visitor came from (UTM tags, ad click IDs, referrer) and
// writes a readable summary into the estimate form, so each request Jack gets by email
// says which ad or site sent it.

type Fn = (...args: unknown[]) => void;
declare global {
  interface Window {
    posthog?: { capture: Fn };
    fbq?: Fn;
    ndp?: Fn;
    gtag?: Fn;
  }
}

const googleAdsId = import.meta.env.PUBLIC_GOOGLE_ADS_ID?.trim();
const googleLeadLabel = import.meta.env.PUBLIC_GOOGLE_ADS_LEAD_LABEL?.trim();
const googleCallLabel = import.meta.env.PUBLIC_GOOGLE_ADS_CALL_LABEL?.trim();

const ATTRIBUTION_KEY = 'stansky-attribution';
const SUBMITTED_KEY = 'stansky-estimate-submitted';

const store = {
  get(storage: 'localStorage' | 'sessionStorage', key: string) {
    try {
      return window[storage].getItem(key);
    } catch {
      return null;
    }
  },
  set(storage: 'localStorage' | 'sessionStorage', key: string, value: string | null) {
    try {
      if (value === null) window[storage].removeItem(key);
      else window[storage].setItem(key, value);
    } catch {
      // Private mode or blocked storage: tracking still works, attribution doesn't.
    }
  },
};

function googleConversion(label: string | undefined) {
  if (googleAdsId && label) window.gtag?.('event', 'conversion', { send_to: `${googleAdsId}/${label}` });
}

// --- Where did this visitor come from? -------------------------------------------------

interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  clickId?: string;
  referrer?: string;
  landingPage: string;
}

function rememberAttribution() {
  const params = new URLSearchParams(location.search);
  const clickId = ['fbclid', 'gclid', 'ndclid'].find((p) => params.has(p));
  const tagged = params.has('utm_source') || clickId;
  const referrer = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer : undefined;

  // A tagged ad click always wins (latest campaign gets the credit). Otherwise keep the
  // first thing we saw, so browsing around the site doesn't erase how they arrived.
  if (!tagged && store.get('localStorage', ATTRIBUTION_KEY)) return;

  const attribution: Attribution = {
    source: params.get('utm_source') ?? undefined,
    medium: params.get('utm_medium') ?? undefined,
    campaign: params.get('utm_campaign') ?? undefined,
    content: params.get('utm_content') ?? undefined,
    clickId,
    referrer: referrer ? new URL(referrer).host : undefined,
    landingPage: location.pathname,
  };
  store.set('localStorage', ATTRIBUTION_KEY, JSON.stringify(attribution));
}

function describeAttribution(): string {
  const raw = store.get('localStorage', ATTRIBUTION_KEY);
  if (!raw) return 'Direct visit';
  try {
    const a = JSON.parse(raw) as Attribution;
    const clickSource = { fbclid: 'facebook', gclid: 'google', ndclid: 'nextdoor' }[a.clickId ?? ''];
    const from = a.source ?? clickSource ?? a.referrer ?? 'direct';
    const parts = [
      [from, a.medium].filter(Boolean).join(' / '),
      a.campaign && `campaign: ${a.campaign}`,
      a.content && `ad: ${a.content}`,
      `landed on ${a.landingPage}`,
    ];
    return parts.filter(Boolean).join(', ');
  } catch {
    return 'Unknown';
  }
}

// --- Estimate form -------------------------------------------------------------------

function watchEstimateForm() {
  const form = document.querySelector<HTMLFormElement>('form[name="estimate"]');
  if (!form) return;

  const source = form.querySelector<HTMLInputElement>('input[name="lead_source"]');
  if (source) source.value = describeAttribution();

  form.addEventListener('focusin', () => window.posthog?.capture('estimate_form_started'), { once: true });

  form.addEventListener('submit', () => {
    // The conversion fires on the thanks page, after Netlify has accepted the request.
    // This flag makes sure a reload or a direct visit to that page doesn't count.
    const data = new FormData(form);
    store.set(
      'sessionStorage',
      SUBMITTED_KEY,
      JSON.stringify({ project: data.get('project'), town: data.get('town') }),
    );
  });
}

function reportSubmission() {
  if (!location.pathname.startsWith('/contact/thanks')) return;
  const raw = store.get('sessionStorage', SUBMITTED_KEY);
  if (!raw) return;
  store.set('sessionStorage', SUBMITTED_KEY, null);

  let details: { project?: string; town?: string } = {};
  try {
    details = JSON.parse(raw);
  } catch {}

  // Never send name, email, phone or message to any tracker.
  window.posthog?.capture('estimate_submitted', { project: details.project, town: details.town });
  window.fbq?.('track', 'Lead', { content_name: details.project });
  window.ndp?.('track', 'LEAD');
  googleConversion(googleLeadLabel);
}

// --- Phone and email taps ------------------------------------------------------------

function watchContactLinks() {
  document.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest?.('a[href^="tel:"], a[href^="mailto:"]');
    if (!link) return;
    const isPhone = link.getAttribute('href')!.startsWith('tel:');
    const where = { page: location.pathname, placement: link.closest('header, footer, section, main')?.tagName.toLowerCase() };

    window.posthog?.capture(isPhone ? 'phone_clicked' : 'email_clicked', where);
    window.fbq?.('track', 'Contact');
    if (isPhone) googleConversion(googleCallLabel);
  });
}

rememberAttribution();
watchEstimateForm();
reportSubmission();
watchContactLinks();
