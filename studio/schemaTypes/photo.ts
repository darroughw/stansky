import {defineField, defineType} from 'sanity'

// A photo with required alt text. Used everywhere a picture appears on the site.
export const photo = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Describe the photo',
      description:
        'What someone would see, for people using screen readers and for Google. E.g. "White soaking tub with a marble-look surround and black fixtures". Don\'t start with "Photo of".',
      type: 'string',
      validation: (rule) => rule.required().min(8).error('Add a short description of the photo.'),
    }),
  ],
})
