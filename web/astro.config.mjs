// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Absolute URLs (canonical, share images, sitemap) must point at whatever is actually
// serving the site. Before launch that's the Netlify address (Netlify sets URL at build);
// after launch (SITE_LIVE=true) it's the real domain.
const site =
  process.env.SITE_LIVE === 'true' ? 'https://stanskyconstruction.com' : (process.env.URL ?? 'https://stanskyconstruction.com');

export default defineConfig({
  site,
  trailingSlash: 'always',
  // Pages are small and visitors usually land on just one (often from an ad), so put the
  // CSS in the page itself instead of making the first paint wait on extra requests.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => !page.includes('/contact/thanks/') })],
  image: {
    responsiveStyles: true,
    // Sanity photos are downloaded and optimized at build time like local ones.
    domains: ['cdn.sanity.io'],
  },
});
