import {defineField, defineType} from 'sanity'
import {CommentIcon} from '@sanity/icons/Comment'

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  icon: CommentIcon,
  description: 'Copy reviews word for word from where they were posted.',
  fields: [
    defineField({
      name: 'author',
      title: 'Name as shown on the review',
      description: 'E.g. "Elaine N."',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'text', title: 'Review', type: 'text', rows: 6, validation: (rule) => rule.required()}),
    defineField({
      name: 'source',
      title: 'Posted on',
      type: 'string',
      options: {
        list: [
          {title: 'Google', value: 'google'},
          {title: 'Angi', value: 'angi'},
          {title: 'HomeAdvisor', value: 'homeadvisor'},
          {title: 'Sent directly', value: 'direct'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'rating', title: 'Stars', type: 'number', validation: (rule) => rule.min(1).max(5).integer()}),
    defineField({name: 'date', title: 'Date', type: 'date'}),
  ],
  preview: {select: {title: 'author', subtitle: 'text'}},
})
