// Analytics and ad pixels. Each one switches on when its ID is set in Netlify
// (Site configuration > Environment variables) and stays off otherwise, so the site
// ships no tracking JavaScript at all until something is configured.
//
// Only production deploys load them (Netlify sets CONTEXT). Local builds and deploy
// previews would otherwise pollute the numbers and the ad platforms' audiences.

const env = import.meta.env;
const isProductionDeploy = env.CONTEXT === 'production';

const id = (value: string | undefined) => (isProductionDeploy && value?.trim()) || undefined;

export const analytics = {
  /** PostHog project API key (phc_...). Visitors, funnels, session replay. */
  posthogKey: id(env.PUBLIC_POSTHOG_KEY),
  posthogHost: env.PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com',
  /** Meta (Facebook/Instagram) pixel ID, digits only. */
  metaPixelId: id(env.PUBLIC_META_PIXEL_ID),
  /** Nextdoor pixel ID from Nextdoor Ads Manager. */
  nextdoorPixelId: id(env.PUBLIC_NEXTDOOR_PIXEL_ID),
  /** Google Ads tag ID, AW-XXXXXXXXX. Conversion labels are read in track.ts. */
  googleAdsId: id(env.PUBLIC_GOOGLE_ADS_ID),
};

export const analyticsEnabled = Object.entries(analytics).some(([key, value]) => key !== 'posthogHost' && value);
