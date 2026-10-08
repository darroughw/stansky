interface ImportMetaEnv {
  /** Set by Netlify: production, deploy-preview, branch-deploy or dev. */
  readonly CONTEXT?: string;
  readonly SITE_LIVE?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
  readonly PUBLIC_META_PIXEL_ID?: string;
  readonly PUBLIC_NEXTDOOR_PIXEL_ID?: string;
  readonly PUBLIC_GOOGLE_ADS_ID?: string;
  readonly PUBLIC_GOOGLE_ADS_LEAD_LABEL?: string;
  readonly PUBLIC_GOOGLE_ADS_CALL_LABEL?: string;
}
