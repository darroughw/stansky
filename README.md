# Stansky Construction website

Static site for stanskyconstruction.com. Astro 7 + TypeScript in `web/`; Sanity Studio (CMS) to be added in `studio/`.

```sh
cd web
npm run dev      # http://localhost:4321
npm run build    # outputs web/dist
npx astro check  # type-check
```

## Where things live

- `web/src/data/business.ts` – name, phone, service area, license, social links. Single source for footer, JSON-LD and llms.txt. Empty fields are hidden and listed as warnings at build time.
- `web/src/content/` – services, projects, FAQs (drafts until Jack answers), reviews.
- `web/src/assets/projects/` – web-sized photos (metadata/GPS stripped). Originals stay in `clientAssets/` (git-ignored).
- `web/src/lib/schema.ts` – structured data builders.
- Generated: `/sitemap-index.xml`, `/robots.txt`, `/llms.txt`.

## Environment

- `PUBLIC_FORM_ENDPOINT` – where the contact form posts (Formspree/Web3Forms/Basin URL).
