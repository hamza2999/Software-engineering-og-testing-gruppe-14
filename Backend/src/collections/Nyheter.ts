import type { CollectionBeforeChangeHook, CollectionConfig, Where } from 'payload'

import { nyhetDetailsEndpoint, nyhetOverviewEndpoint } from '../modules/nyheter/http/nyhetEndpoints'
import type { Nyheter as NyhetDocument } from '../payload-types'

const setPublishedAt: CollectionBeforeChangeHook<NyhetDocument> = ({ data, originalDoc }) => {
  const status = data._status ?? originalDoc?._status
  if (originalDoc?.publishedAt) {
    data.publishedAt = originalDoc.publishedAt
  } else if (status === 'published') {
    data.publishedAt = new Date().toISOString()
  } else {
    data.publishedAt = null
  }
  return data
}

export const Nyheter: CollectionConfig = {
  slug: 'nyheter',

  endpoints: [nyhetOverviewEndpoint, nyhetDetailsEndpoint],

  versions: {
    drafts: true,
  },

  admin: {
    useAsTitle: 'title',
  },

  access: {
    readVersions: ({ req }) => Boolean(req.user),
    read: ({ req }): boolean | Where => {
      if (req.user) {
        return true
      }

      return {
        and: [
          { lokallag: { exists: true } },
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

  hooks: {
    beforeChange: [setPublishedAt],
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
      required: true,
    },
  ],
}
