// llms.txt (https://llmstxt.org): a plain summary AI assistants can quote.
// Built from the same data as the pages, so it never drifts.
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { business } from '../data/business';

export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const b = business;
  const services = (await getCollection('services')).sort((x, y) => x.data.order - y.data.order);
  const projects = (await getCollection('projects')).sort((x, y) => x.data.order - y.data.order);
  const faqs = await getCollection('faqs');

  const facts = [
    `Owner: ${b.owner}`,
    `Based in: ${b.city}, ${b.region}`,
    `Service area: ${b.serviceArea.map((t) => `${t}, ${b.region}`).join('; ')}`,
    b.phone && `Phone: ${b.phone}`,
    b.email && `Email: ${b.email}`,
    b.licenseNumber && `NC general contractor license: ${b.licenseNumber}`,
    b.insured && 'Insured: yes',
    b.foundedYear && `In business since: ${b.foundedYear}`,
    `Background: ${b.owner} spent three years as a carpentry apprentice before starting the company.`,
    `Estimates: request one at ${url('/contact/')}`,
  ].filter(Boolean);

  const body = [
    `# ${b.name}`,
    '',
    `> ${b.name} is a residential remodeling company in ${b.city}, ${b.region}, run by ${b.owner}. It remodels kitchens and bathrooms and builds decks, porches, screened porches and ADUs.`,
    '',
    '## Key facts',
    '',
    ...facts.map((f) => `- ${f}`),
    '',
    '## Services',
    '',
    ...services.map((s) => `- [${s.data.title}](${url(`/services/${s.id}/`)}): ${s.data.summary}`),
    '',
    '## Projects',
    '',
    ...projects.map(
      (p) => {
        const place = [p.data.neighborhood, p.data.location].filter(Boolean).join(', ');
        return `- [${p.data.title}](${url(`/portfolio/${p.id}/`)})${place ? ` (${place})` : ''}: ${p.data.summary}`;
      },
    ),
    ...(faqs.length
      ? ['', '## Frequently asked questions', '', ...faqs.flatMap((f) => [`### ${f.data.question}`, '', f.data.answer, ''])]
      : []),
    '',
    '## Optional',
    '',
    `- [About ${b.owner}](${url('/about/')})`,
    ...Object.entries(b.social)
      .filter(([, v]) => v)
      .map(([k, v]) => `- [${k}](${v})`),
    '',
  ];

  return new Response(body.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
