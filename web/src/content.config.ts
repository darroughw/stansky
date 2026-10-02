// Content collections, loaded from Sanity at build time.
// Entries keep the same shape the pages already use; rich text is pre-rendered to HTML
// so `render(entry)` works exactly like it did with markdown.
import { defineCollection, reference } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { sanity, PHOTO, toPhoto, portableTextToHtml } from './lib/sanity';

const photo = z.object({
  src: z.url(),
  width: z.number(),
  height: z.number(),
  alt: z.string().min(8),
  position: z.string(),
});

/** Fetches one GROQ query; each result needs an `id` and may carry a Portable Text `body`. */
function sanityLoader(name: string, query: string, map: (doc: any) => Record<string, unknown> = (d) => d): Loader {
  return {
    name: `sanity-${name}`,
    load: async ({ store, parseData, generateDigest, logger }) => {
      const docs: any[] = await sanity.fetch(query);
      store.clear();
      for (const doc of docs) {
        const { id, body, ...rest } = map(doc) as { id: string; body?: unknown };
        // GROQ returns null for empty fields; drop them so .optional() schemas apply.
        const clean = JSON.parse(JSON.stringify(rest, (_k, v) => (v === null ? undefined : v)));
        const data = await parseData({ id, data: clean });
        const html = portableTextToHtml(body);
        store.set({ id, data, digest: generateDigest({ data, html }), ...(html && { rendered: { html } }) });
      }
      logger.info(`${docs.length} ${name}`);
    },
  };
}

const services = defineCollection({
  loader: sanityLoader(
    'services',
    `*[_type == "service" && defined(slug.current)]{
      "id": slug.current, title, shortTitle, metaTitle, metaDescription, summary, order, body,
      cover${PHOTO}
    }`,
    (d) => ({ ...d, cover: toPhoto(d.cover) }),
  ),
  schema: z.object({
    title: z.string(),
    shortTitle: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().max(160),
    summary: z.string(),
    order: z.number(),
    cover: photo.optional(),
  }),
});

const projects = defineCollection({
  loader: sanityLoader(
    'projects',
    `*[_type == "project" && defined(slug.current) && defined(cover.asset)]{
      "id": slug.current, title, summary, neighborhood, location, status, featured, order, body,
      "service": service->slug.current,
      cover${PHOTO}, before${PHOTO}, gallery[]${PHOTO}
    }`,
    (d) => ({
      ...d,
      cover: toPhoto(d.cover),
      before: toPhoto(d.before),
      gallery: (d.gallery ?? []).map(toPhoto).filter(Boolean),
    }),
  ),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    neighborhood: z.string().optional(),
    location: z.string().optional(),
    service: reference('services').optional(),
    status: z.enum(['complete', 'in-progress']).default('complete'),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    cover: photo,
    gallery: z.array(photo).default([]),
    before: photo.optional(),
  }),
});

// Only published questions are fetched; unanswered drafts stay in the Studio.
const faqs = defineCollection({
  loader: sanityLoader(
    'faqs',
    `*[_type == "faq" && defined(answer)] | order(question asc){ "id": _id, question, answer, "service": service->slug.current }`,
  ),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    service: z.string().optional(),
  }),
});

const reviews = defineCollection({
  loader: sanityLoader(
    'reviews',
    `*[_type == "review"] | order(date desc){ "id": _id, author, text, source, rating, date }`,
  ),
  schema: z.object({
    author: z.string(),
    text: z.string(),
    source: z.enum(['google', 'angi', 'homeadvisor', 'direct']),
    rating: z.number().min(1).max(5).optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = { services, projects, faqs, reviews };
