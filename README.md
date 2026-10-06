# Stansky Construction

The website for Stansky Construction, Jack Stansky's remodeling and carpentry company in Winston-Salem, NC. Designed and built by Darrough West.

It replaces a GoDaddy builder site that had three pages, no phone number, and a 4.8 second load. The new site is static, loads in about 1.5 seconds on a throttled mobile connection, scores 100 on Lighthouse accessibility, and gives Jack an editor he can use from his phone.

| | |
|---|---|
| Preview site | https://stansky.netlify.app |
| Editor (Sanity Studio) | https://stansky.sanity.studio |
| Production domain | stanskyconstruction.com (still on GoDaddy until launch) |
| Repo | https://github.com/darroughw/stansky |

## For Jack: editing the site

Sign in at **stansky.sanity.studio**. Everything on the site that changes lives there:

- **Projects:** add a job with a few photos and a short story. Turn on "Show on the home page" for the best ones.
- **Questions & answers:** replace anything in [brackets] with your real answer, turn off "Placeholder answer", and publish.
- **Reviews:** copy reviews word for word from Google, Angi or HomeAdvisor.
- **Business info:** phone, email, towns, license and profile links. This shows on every page and is what Google reads.

Nothing goes live until you click **Publish**. After that the site rebuilds itself and the change is up in a minute or two. Every edit has a history, so anything can be undone.

## How it works

1. Content is edited in **Sanity** (project `983tg09r`, dataset `production`).
2. Publishing fires a Sanity webhook at a **Netlify** build hook.
3. Netlify builds the **Astro** site in `web/`, pulling content and photos from Sanity.
4. Astro writes plain HTML with no client-side JavaScript. Photos are resized and converted to AVIF and WebP at build time.

Pushing to `main` also deploys.

## Running it locally

Node 22 or newer.

```sh
cd web
npm install
npm run dev        # site at http://localhost:4321
npm run build      # production build in web/dist
npx astro check    # type check

cd ../studio
npm install
npm run dev        # editor at http://localhost:3333
npx sanity deploy  # publish editor changes to stansky.sanity.studio
```

The site reads published content from Sanity, so local builds need a network connection but no keys.

## Project layout

```text
web/                        the website (Astro 7 + TypeScript)
  src/content.config.ts     loads Sanity into Astro content collections
  src/data/business.ts      name, phone, service area from Sanity's Business info
  src/lib/schema.ts         structured data for Google (GeneralContractor, Service, FAQPage)
  src/lib/og.ts             branded 1200x630 share card for every page
  src/pages/                pages, plus /llms.txt, /robots.txt and /og/*.jpg
  src/assets/               logo art, fonts and the two photos the layout uses directly
  scripts/make-icons.mjs    regenerates the favicon, touch icon and logo.png
studio/                     the editor (Sanity Studio)
  schemaTypes/              the editing forms, written for Jack
  scripts/                  one-time content import and the placeholder FAQ answers
netlify.toml                build settings, caching and security headers
clientAssets/               Jack's original photos and logo files (not in git)
```

## Decisions worth knowing

- **No invented facts.** Prices, timelines, license details and reviews come from Jack. Anything missing is hidden on the site, listed as a warning at build time, or marked as a placeholder.
- **Placeholders can't ship by accident.** FAQ answers flagged "Placeholder" are labeled on the site, left out of Google's FAQ data and `llms.txt`, and hidden entirely once the site launches.
- **Hidden from search until launch.** Every page is `noindex` until `SITE_LIVE=true` is set in Netlify. That keeps the netlify.app copy from competing with the live GoDaddy site.
- **Photos keep their privacy.** GPS and camera data were stripped from the original uploads so client addresses don't leak.
- **Netlify over Vercel.** Netlify's free plan allows a commercial site and handles the contact form, so Jack has nothing to pay for.

## Launch checklist

- [ ] Jack reviews the preview site and confirms the copy
- [ ] Business info filled in: phone, email, license number, insurance, profile links
- [ ] FAQ answers confirmed and placeholders turned off
- [ ] A neighborhood or town on each project
- [ ] Netlify: **Enable form detection**, redeploy, send a test request, set up email notifications for the `estimate` form
- [ ] Jack invited to Sanity as an Editor
- [ ] Domain added in Netlify and DNS updated at GoDaddy
- [ ] `SITE_LIVE=true` set in Netlify, then redeploy
- [ ] Google Business Profile claimed and matching the site's name, phone and service area

## Credits

Logo and truck illustration: Stansky Construction. Type: [Archivo](https://fonts.google.com/specimen/Archivo) by Omnibus-Type, under the SIL Open Font License (`web/src/assets/fonts/OFL.txt`).
