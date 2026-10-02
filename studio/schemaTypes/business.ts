import {defineField, defineType} from 'sanity'
import {HomeIcon} from '@sanity/icons/Home'

// Singleton (document id "business"). Name, phone and service area must match
// Google Business Profile, Angi, HomeAdvisor and Instagram exactly.
export const business = defineType({
  name: 'business',
  title: 'Business info',
  type: 'document',
  icon: HomeIcon,
  groups: [
    {name: 'contact', title: 'Contact', default: true},
    {name: 'trust', title: 'License & insurance'},
    {name: 'profiles', title: 'Online profiles'},
  ],
  fields: [
    defineField({name: 'name', title: 'Business name', type: 'string', group: 'contact', validation: (r) => r.required()}),
    defineField({
      name: 'legalName',
      title: 'Registered name',
      description: 'E.g. "Stansky Construction LLC". Shown in the footer copyright.',
      type: 'string',
      group: 'contact',
    }),
    defineField({name: 'owner', title: 'Owner', type: 'string', group: 'contact', validation: (r) => r.required()}),
    defineField({
      name: 'phone',
      title: 'Phone',
      description: 'Format: (336) 555-0123. Appears in the header and on every page.',
      type: 'string',
      group: 'contact',
      validation: (r) => r.regex(/^\(\d{3}\) \d{3}-\d{4}$/, {name: 'phone'}).warning('Use the format (336) 555-0123.'),
    }),
    defineField({name: 'email', title: 'Email', type: 'email', group: 'contact'}),
    defineField({name: 'city', title: 'City', type: 'string', group: 'contact', validation: (r) => r.required()}),
    defineField({name: 'region', title: 'State', type: 'string', group: 'contact', validation: (r) => r.required().length(2)}),
    defineField({
      name: 'postalCode',
      title: 'ZIP code (optional)',
      description: 'Only if you want it public.',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'serviceArea',
      title: 'Towns you work in',
      description: 'One town per line, no state. Shown in the footer and used by Google.',
      type: 'array',
      of: [{type: 'string'}],
      group: 'contact',
      validation: (r) => r.required().min(1),
    }),
    defineField({name: 'hours', title: 'Hours', description: 'E.g. "Mon–Fri 7am–5pm"', type: 'string', group: 'contact'}),
    defineField({
      name: 'licenseNumber',
      title: 'NC general contractor license #',
      description: 'Leave empty if not licensed.',
      type: 'string',
      group: 'trust',
    }),
    defineField({name: 'insured', title: 'Insured', type: 'boolean', group: 'trust'}),
    defineField({name: 'foundedYear', title: 'Year started', type: 'number', group: 'trust', validation: (r) => r.min(1950).max(2100).integer()}),
    defineField({name: 'instagram', title: 'Instagram URL', type: 'url', group: 'profiles'}),
    defineField({name: 'google', title: 'Google Business Profile URL', type: 'url', group: 'profiles'}),
    defineField({name: 'angi', title: 'Angi profile URL', type: 'url', group: 'profiles'}),
    defineField({name: 'homeAdvisor', title: 'HomeAdvisor profile URL', type: 'url', group: 'profiles'}),
  ],
  preview: {prepare: () => ({title: 'Business info'})},
})
