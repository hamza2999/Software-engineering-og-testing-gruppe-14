import type { CollectionConfig, Where } from 'payload'

export const Nyheter: CollectionConfig = {
  slug: 'nyheter',

  versions: {
    drafts: true,
  },

  admin: {
    useAsTitle: 'title',
  },

  access: {
    read: ({ req }): boolean | Where => {
      if (req.user) {
        return true
      }

      return {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            publishedAt: {
              less_than_equal: new Date().toISOString(),
            },
          },
        ],
      }
    },
  },

  fields: [
    {
      name: 'title',
      label: 'Tittel',
      type: 'text',
      required: true,
    },

    {
      name: 'publishedAt',
      label: 'Publisert dato',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },

    {
      name: 'content',
      label: 'Innhold',
      type: 'textarea',
      required: true,
    },

    {
      name: 'lokallag',
      label: 'Lokallag',
      type: 'relationship',
      relationTo: 'lokallag',
    },
  ],
}
