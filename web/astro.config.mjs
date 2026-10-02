// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stanskyconstruction.com',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/contact/thanks/') })],
  image: {
    responsiveStyles: true,
    // Sanity photos are downloaded and optimized at build time like local ones.
    domains: ['cdn.sanity.io'],
  },
});
