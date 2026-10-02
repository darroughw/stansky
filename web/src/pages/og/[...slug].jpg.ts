// One share card per page. Titles here are written for people seeing a link
// in a text or social post, so they're shorter than the <title> written for Google.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard, type CardPhoto } from '../../lib/og';
import { business } from '../../data/business';

type Card = { eyebrow: string; title: string; photo?: CardPhoto; footer?: string };

const where = `${business.city}, ${business.region}`;
const deck: CardPhoto = { file: 'projects/rooftop-deck-railing.jpg' };
const porch: CardPhoto = { file: 'projects/screened-porch-after.jpg' };

export const getStaticPaths = (async () => {
  const services = await getCollection('services');
  const projects = await getCollection('projects');
  const byId = new Map(services.map((s) => [s.id, s]));
  const photoOf = (p?: { src: string; position: string }): CardPhoto | undefined => (p ? { src: p.src, position: p.position } : undefined);
  const kitchen = photoOf(services.find((s) => s.id === 'kitchen-remodeling')?.data.cover) ?? deck;

  const cards: Record<string, Card> = {
    home: {
      eyebrow: `Remodeling · ${where}`,
      title: 'Kitchens, baths, decks & ADUs',
      photo: kitchen,
    },
    services: { eyebrow: `Services · ${where}`, title: 'What we build', photo: deck },
    portfolio: { eyebrow: `Our work · ${where}`, title: 'Real projects, real photos', photo: porch },
    about: { eyebrow: business.name, title: `Meet ${business.owner.split(' ')[0]}`, photo: porch },
    contact: { eyebrow: business.name, title: 'Request an estimate' },
  };
  for (const s of services) {
    cards[`services/${s.id}`] = { eyebrow: `${business.name} · ${where}`, title: s.data.shortTitle, photo: photoOf(s.data.cover) };
  }
  for (const p of projects) {
    const place = [p.data.neighborhood, p.data.location].filter(Boolean).join(', ');
    const service = p.data.service ? byId.get(p.data.service.id)?.data.shortTitle : undefined;
    cards[`portfolio/${p.id}`] = {
      eyebrow: place || (service ? `${service} · ${where}` : where),
      title: p.data.title,
      photo: photoOf(p.data.cover),
      footer: business.name,
    };
  }
  return Object.entries(cards).map(([slug, card]) => ({ params: { slug }, props: card }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const jpg = await renderCard(props as Card);
  return new Response(new Uint8Array(jpg), { headers: { 'Content-Type': 'image/jpeg' } });
};
