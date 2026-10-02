// Sanity access for the build. The dataset is public, so no token is needed;
// only published documents are read (drafts like unanswered FAQs never reach the site).
import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { toHTML } from '@portabletext/to-html';

export const sanity = createClient({
  projectId: '983tg09r',
  dataset: 'production',
  apiVersion: '2025-01-01',
  useCdn: false, // builds always read the latest published content
  perspective: 'published',
});

const builder = createImageUrlBuilder(sanity);

/** GROQ projection for a `photo` field. */
export const PHOTO = `{alt, crop, hotspot, asset->{_id, metadata{dimensions{width, height}}}}`;

type SanityPhoto = {
  alt: string;
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number };
  asset: { _id: string; metadata: { dimensions: { width: number; height: number } } };
};

export type Photo = { src: string; width: number; height: number; alt: string; position: string };

/**
 * Turns a Sanity photo into a remote source Astro's image pipeline can optimize
 * (it downloads it at build time and emits AVIF/WebP like a local image).
 * Jack's crop is applied in the URL; his hotspot becomes the CSS object-position.
 */
export function toPhoto(p: SanityPhoto | null | undefined): Photo | undefined {
  if (!p?.asset) return undefined;
  const { width: w, height: h } = p.asset.metadata.dimensions;
  const c = p.crop ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const cw = Math.round(w * (1 - c.left - c.right));
  const ch = Math.round(h * (1 - c.top - c.bottom));
  const scale = Math.min(1, 2400 / Math.max(cw, ch));
  const width = Math.round(cw * scale);
  const height = Math.round(ch * scale);
  const src = builder
    .image({ asset: { _ref: p.asset._id }, crop: p.crop, hotspot: p.hotspot })
    .width(width)
    .height(height)
    .quality(90)
    .url();
  const position = p.hotspot ? `${Math.round(p.hotspot.x * 100)}% ${Math.round(p.hotspot.y * 100)}%` : '50% 50%';
  return { src, width, height, alt: p.alt, position };
}

export const portableTextToHtml = (body: unknown) =>
  body
    ? toHTML(body as any, {
        components: {
          marks: {
            link: ({ children, value }) => {
              const href = String(value?.href ?? '');
              const external = /^https?:\/\//.test(href) && !href.includes('stanskyconstruction.com');
              return `<a href="${href.replace(/"/g, '&quot;')}"${external ? ' rel="noopener"' : ''}>${children}</a>`;
            },
          },
        },
      })
    : '';
