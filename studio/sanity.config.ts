import {defineConfig} from 'sanity'
import {structureTool, type StructureResolver} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {HomeIcon} from '@sanity/icons/Home'
import {schemaTypes} from './schemaTypes'

const SINGLETONS = new Set(['business'])

// Sidebar in the order Jack uses it: projects first, setup-type things last.
const structure: StructureResolver = (S) =>
  S.list()
    .title('Website')
    .items([
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('faq').title('Questions & answers'),
      S.documentTypeListItem('review').title('Reviews'),
      S.divider(),
      S.documentTypeListItem('service').title('Services'),
      S.listItem()
        .title('Business info')
        .id('business')
        .icon(HomeIcon)
        .child(S.document().schemaType('business').documentId('business').title('Business info')),
    ])

export default defineConfig({
  name: 'default',
  title: 'Stansky Construction',

  projectId: '983tg09r',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    // Business info is a single document: hide it from "Create new".
    templates: (templates) => templates.filter(({schemaType}) => !SINGLETONS.has(schemaType)),
  },

  document: {
    // No duplicating or deleting the singleton.
    actions: (actions, {schemaType}) =>
      SINGLETONS.has(schemaType)
        ? actions.filter(({action}) => action && ['publish', 'discardChanges', 'restore'].includes(action))
        : actions,
  },
})
