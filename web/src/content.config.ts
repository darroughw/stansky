// Content collections. Field names mirror the planned Sanity document types
// (service, project, faq, review) so swapping the loaders later doesn't touch pages.
import { defineCollection, reference, type ImageFunction } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const photo = (image: ImageFunction) =>
  z.object({
    src: image(),
    // Describe what's in the photo, not "image of". Required: no photo ships without alt text.
    alt: z.string().min(8),
  });

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Short name for nav and cards ("Kitchens")
      shortTitle: z.string(),
      metaTitle: z.string().max(60),
      metaDescription: z.string().max(160),
      summary: z.string(),
      order: z.number(),
      // Optional until there are real photos for every service (no ADU photos yet).
      cover: photo(image).optional(),
    }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      // Neighborhood names ("Buena Vista", "Ardmore") are a local signal without exposing an address.
      neighborhood: z.string().optional(),
      location: z.string().optional(),
      service: reference('services').optional(),
      status: z.enum(['complete', 'in-progress']).default('complete'),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      cover: photo(image),
      gallery: z.array(photo(image)).default([]),
      before: photo(image).optional(),
    }),
});

const faqs = defineCollection({
  loader: file('./src/content/faqs.json'),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    service: z.string().optional(),
    // Drafts stay off the site until Jack has answered in his own words.
    draft: z.boolean().default(true),
  }),
});

const reviews = defineCollection({
  loader: file('./src/content/reviews.json'),
  schema: z.object({
    author: z.string(),
    text: z.string(),
    source: z.enum(['google', 'angi', 'homeadvisor', 'direct']),
    rating: z.number().min(1).max(5).optional(),
    date: z.coerce.date().optional(),
  }),
});

export const collections = { services, projects, faqs, reviews };
