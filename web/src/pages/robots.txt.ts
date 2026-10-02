import type { APIRoute } from 'astro';

// Pages carry noindex until launch (see Base.astro). robots.txt stays Allow so crawlers can see that noindex.
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL('sitemap-index.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
