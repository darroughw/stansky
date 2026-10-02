# Stansky Construction website

Static site for stanskyconstruction.com. Astro 7 + TypeScript in `web/`; content edited in Sanity Studio (`studio/`, hosted at https://stansky.sanity.studio). Sanity project `983tg09r`, dataset `production` (public, read-only without a token).

```sh
cd web
npm run dev      # http://localhost:4321
npm run build    # outputs web/dist
npx astro check  # type-check
```

## Where things live

- **Sanity** – projects, services, questions & answers, reviews and Business info. Only *published* documents reach the site; unanswered FAQs sit as drafts.
- `web/src/content.config.ts` – loads Sanity into Astro content collections at build time. Sanity photos are downloaded and optimized by Astro (AVIF/WebP, JPEG fallback).
- `web/src/data/business.ts` – reads the Business info document; feeds header/footer, JSON-LD and llms.txt. Empty fields are hidden and listed as warnings at build time.
- `web/src/assets/` – brand art and the two photos the layout uses directly (hero, default share image).
- `studio/schemaTypes/` – the editing forms. `studio/scripts/import-from-web.ts` was the one-time import.

```sh
cd studio
npm run dev      # local Studio at http://localhost:3333
npx sanity deploy  # publish Studio changes to stansky.sanity.studio
```
- `web/src/lib/schema.ts` – structured data builders.
- Generated: `/sitemap-index.xml`, `/robots.txt`, `/llms.txt`.

## Hosting (Netlify)

- `netlify.toml` builds `web/` and publishes `web/dist`. Pushing to `main` deploys.
- Publishing in Sanity triggers a Netlify rebuild via a webhook → Netlify build hook (about a minute to go live).
- Contact form uses Netlify Forms (form name `estimate`). Turn on email notifications in Netlify > Forms.
- **Launch switch:** every page is `noindex` until the Netlify env var `SITE_LIVE=true` is set. Set it only after stanskyconstruction.com points at Netlify, then redeploy.
