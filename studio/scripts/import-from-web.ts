// One-time import of the content that lived in web/src/content into Sanity.
// Safe to re-run: documents use fixed ids and createOrReplace.
//   npx sanity exec scripts/import-from-web.ts --with-user-token
import fs from 'node:fs'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {parse as parseYaml} from 'yaml'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2025-01-01'})
const WEB = path.resolve(process.cwd(), '../web/src')
const key = () => randomUUID().slice(0, 12)

// --- markdown (the small subset our content uses) -> Portable Text
function mdToBlocks(md: string) {
  const blocks: any[] = []
  const block = (text: string, extra: Record<string, unknown> = {}) => ({
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: key(), text, marks: []}],
    ...extra,
  })
  for (const chunk of md.trim().split(/\n\s*\n/)) {
    const lines = chunk.split('\n')
    if (lines.every((l) => /^[-*] /.test(l))) {
      for (const l of lines) blocks.push(block(l.replace(/^[-*] /, ''), {listItem: 'bullet', level: 1}))
    } else if (/^#{2,3} /.test(chunk)) {
      blocks.push(block(chunk.replace(/^#{2,3} /, ''), {style: 'h2'}))
    } else {
      blocks.push(block(lines.join(' ')))
    }
  }
  return blocks
}

function readMd(file: string) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error(`No frontmatter in ${file}`)
  return {data: parseYaml(m[1]) as Record<string, any>, body: m[2]}
}

// --- images: upload once per file
const uploaded = new Map<string, string>()
async function photo(p: {src: string; alt: string} | undefined, fromFile: string) {
  if (!p) return undefined
  const abs = path.resolve(path.dirname(fromFile), p.src)
  let assetId = uploaded.get(abs)
  if (!assetId) {
    const asset = await client.assets.upload('image', fs.createReadStream(abs), {filename: path.basename(abs)})
    assetId = asset._id
    uploaded.set(abs, assetId)
    console.log('  uploaded', path.basename(abs))
  }
  return {_type: 'photo', asset: {_type: 'reference', _ref: assetId}, alt: p.alt}
}

async function run() {
  const tx: any[] = []

  console.log('Services')
  const svcDir = path.join(WEB, 'content/services')
  for (const f of fs.readdirSync(svcDir).filter((f: string) => f.endsWith('.md'))) {
    const file = path.join(svcDir, f)
    const slug = f.replace(/\.md$/, '')
    const {data, body} = readMd(file)
    tx.push({
      _id: `service-${slug}`,
      _type: 'service',
      title: data.title,
      shortTitle: data.shortTitle,
      slug: {_type: 'slug', current: slug},
      summary: data.summary,
      order: data.order,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      cover: await photo(data.cover, file),
      body: mdToBlocks(body),
    })
  }

  console.log('Projects')
  const projDir = path.join(WEB, 'content/projects')
  for (const f of fs.readdirSync(projDir).filter((f: string) => f.endsWith('.md'))) {
    const file = path.join(projDir, f)
    const slug = f.replace(/\.md$/, '')
    const {data, body} = readMd(file)
    const gallery = []
    for (const g of data.gallery ?? []) gallery.push({...(await photo(g, file)), _key: key()})
    tx.push({
      _id: `project-${slug}`,
      _type: 'project',
      title: data.title,
      slug: {_type: 'slug', current: slug},
      summary: data.summary,
      neighborhood: data.neighborhood,
      location: data.location,
      service: data.service ? {_type: 'reference', _ref: `service-${data.service}`} : undefined,
      status: data.status ?? 'complete',
      featured: data.featured ?? false,
      order: data.order ?? 100,
      cover: await photo(data.cover, file),
      before: await photo(data.before, file),
      gallery,
      body: mdToBlocks(body),
    })
  }

  console.log('Questions (as unpublished drafts until Jack answers them)')
  const faqs = JSON.parse(fs.readFileSync(path.join(WEB, 'content/faqs.json'), 'utf8'))
  for (const q of faqs) {
    tx.push({
      _id: `${q.draft ? 'drafts.' : ''}faq-${q.id}`,
      _type: 'faq',
      question: q.question,
      answer: q.answer,
      service: q.service ? {_type: 'reference', _ref: `service-${q.service}`, _weak: true} : undefined,
    })
  }

  console.log('Business info')
  tx.push({
    _id: 'business',
    _type: 'business',
    name: 'Stansky Construction',
    owner: 'Jack Stansky',
    city: 'Winston-Salem',
    region: 'NC',
    serviceArea: ['Winston-Salem', 'Clemmons'],
    instagram: 'https://www.instagram.com/stanskyconstruction/',
  })

  const t = client.transaction()
  for (const doc of tx) t.createOrReplace(JSON.parse(JSON.stringify(doc))) // drops undefined fields
  await t.commit()
  console.log(`Done: ${tx.length} documents, ${uploaded.size} images.`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
