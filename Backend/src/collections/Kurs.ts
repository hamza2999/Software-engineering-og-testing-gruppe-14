import type { CollectionConfig } from 'payload'

export const Kurs: CollectionConfig = {
  slug: 'kurs',

  admin: {
    useAsTitle: 'title',
  },

  access: {
    read: () => true,
  },

  fields: [
    {
      name: 'title',
      label: 'Kursnavn',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      label: 'Kursdato',
      type: 'date',
      required: true,
    },
    {
      name: 'description',
      label: 'Beskrivelse',
      type: 'textarea',
      required: true,
    },
    {
      name: 'image',
      label: 'Bildelenke',
      type: 'text',
    },
  ],
}