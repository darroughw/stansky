import {defineField, defineType} from 'sanity'
import {HelpCircleIcon} from '@sanity/icons/HelpCircle'

export const faq = defineType({
  name: 'faq',
  title: 'Question',
  type: 'document',
  icon: HelpCircleIcon,
  description: 'Unpublished questions stay off the site. Publish once the answer is ready.',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      description: 'Phrase it the way a homeowner would ask Google.',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      description: 'In your own words. Lead with the direct answer, then the details. Real numbers and timelines are what Google and AI assistants quote.',
      type: 'text',
      rows: 6,
      validation: (rule) =>
        rule.required().custom((value) => (value && /\bTODO\b/.test(value) ? 'Replace the TODO with your answer.' : true)),
    }),
    defineField({
      name: 'service',
      title: 'Show on service page',
      description: 'Leave empty for general questions.',
      type: 'reference',
      to: [{type: 'service'}],
    }),
  ],
  preview: {select: {title: 'question', subtitle: 'service.shortTitle'}},
})
