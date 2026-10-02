// Publishes placeholder answers for Jack to review. Facts only Jack can supply are in [brackets].
// Every answer is flagged `placeholder: true`, so the site labels it and hides it after launch.
//   npx sanity exec scripts/placeholder-faqs.ts --with-user-token
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})

const answers: Record<string, {answer: string; order: number}> = {
  // General
  'who-does-the-work': {
    order: 10,
    answer:
      'Jack does. The person who walks your house and writes the estimate is the person on site building it. [Jack: say which trades you bring in, e.g. licensed electricians and plumbers, and how you manage them.]',
  },
  estimates: {
    order: 20,
    answer:
      'Estimates are [free / $X, credited toward the job]. Jack comes out to see the space, talks through what you want, and sends a written estimate within [X days] that lists what is and isn\'t included.',
  },
  'licensed-insured': {
    order: 30,
    answer:
      '[Yes. Stansky Construction is insured, and Jack holds NC general contractor license #XXXXX.] [Jack: confirm license and insurance details. North Carolina requires a general contractor license for larger projects.]',
  },
  permits: {
    order: 40,
    answer:
      '[Yes.] Jack pulls the permits the job needs and schedules the inspections, so you don\'t have to deal with the city or county yourself. [Jack: confirm, and mention which jobs typically need one.]',
  },
  'service-area': {
    order: 50,
    answer:
      'Stansky Construction is based in Winston-Salem and works in [Winston-Salem, Clemmons, and nearby towns]. If you\'re not sure whether you\'re in the area, ask. [Jack: list towns.]',
  },
  // Bathrooms
  'bathroom-timeline': {
    order: 110,
    answer:
      'Most bathroom remodels take about [X–Y weeks] once work starts. A cosmetic update is faster; moving plumbing or replacing a tub with a walk-in shower takes longer. You\'ll get a schedule with the estimate.',
  },
  'bathroom-cost': {
    order: 120,
    answer:
      'In Winston-Salem, bathroom remodels Jack does usually run [$X–$Y]. What moves the price most: tile and fixtures you choose, whether plumbing moves, and how much of the room is replaced. [Jack: real ranges for a refresh vs. a full remodel.]',
  },
  // Kitchens
  'kitchen-timeline': {
    order: 210,
    answer:
      'Plan on about [X–Y weeks] of work for a typical kitchen, plus lead time for cabinets and countertops, which are usually ordered after the design is final. [Jack: confirm typical lead times.]',
  },
  'kitchen-cost': {
    order: 220,
    answer:
      'Kitchen remodels usually run [$X–$Y]. Cabinets and counters are the biggest share; changing the layout adds plumbing and electrical work. [Jack: real ranges and what\'s typical.]',
  },
  // Decks & porches
  'deck-repair-or-replace': {
    order: 310,
    answer:
      'Often it can be repaired. Jack checks the framing, footings and ledger board first. If the structure is sound, replacing boards and railings is far cheaper than a new deck. If it isn\'t, he\'ll show you why before quoting a rebuild.',
  },
  'deck-cost': {
    order: 320,
    answer:
      'A new deck typically runs [$X–$Y per square foot] depending on size, height and materials; screened porches cost more because of the roof. [Jack: real numbers, pressure-treated vs. composite.]',
  },
  'deck-permit': {
    order: 330,
    answer:
      '[Usually yes.] Most new decks and screened porches attached to a house need a building permit and inspections. Jack handles the permit. [Jack: confirm local rules and any exceptions.]',
  },
  // ADUs
  'adu-allowed': {
    order: 410,
    answer:
      '[It depends on your lot and zoning.] Jack starts by checking what your property allows, including size limits and setbacks, before any design work. [Jack: summarize Winston-Salem/Forsyth County ADU rules once confirmed with the city.]',
  },
  'adu-cost': {
    order: 420,
    answer:
      'ADUs usually cost [$X–$Y]. A garage conversion is the least expensive; a new detached cottage costs the most because it needs its own foundation and utility connections. [Jack: real ranges.]',
  },
  'adu-timeline': {
    order: 430,
    answer:
      'Expect about [X months] from first meeting to move-in: [X weeks] for design and permits, then [X months] of construction. [Jack: confirm.]',
  },
  'adu-rent': {
    order: 440,
    answer:
      '[Jack: confirm the city\'s rules on renting an ADU, including any owner-occupancy requirement, before this is published.]',
  },
  'adu-garage': {
    order: 450,
    answer:
      '[Often, yes.] Garages already have walls, a roof and a slab, so a conversion is usually the fastest and least expensive way to add an ADU. Insulation, plumbing and egress windows are the main work. [Jack: confirm.]',
  },
}

async function run() {
  const drafts: any[] = await client.fetch(`*[_type == "faq" && _id in path("drafts.**")]`)
  const tx = client.transaction()
  let n = 0
  for (const d of drafts) {
    const id = d._id.replace(/^drafts\./, '')
    const a = answers[id.replace(/^faq-/, '')]
    if (!a) continue
    const {_id, _rev, _createdAt, _updatedAt, ...rest} = d
    tx.createOrReplace({...rest, _id: id, answer: a.answer, order: a.order, placeholder: true})
    tx.delete(d._id)
    n++
  }
  await tx.commit()
  console.log(`Published ${n} placeholder answers.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
