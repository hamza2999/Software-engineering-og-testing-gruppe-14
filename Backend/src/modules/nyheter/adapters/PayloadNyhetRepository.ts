import type { PayloadRequest, Where } from 'payload'
import type { Nyheter as PayloadNyhet } from '../../../payload-types'
import type { NyhetPage, NyhetPageQuery } from '../application/NyhetRepository'
import type { Nyhet } from '../domain/Nyhet'

function toNyhet(document: PayloadNyhet): Nyhet {
  const lokallagId =
    typeof document.lokallag === 'object' ? document.lokallag?.id : document.lokallag

  if (!lokallagId || !document.publishedAt) {
    throw new Error('Nyheten mangler lokallag eller publiseringsdato.')
  }

  return {
    id: String(document.id),
    title: document.title,
    content: document.content,
    lokallagId: String(lokallagId),
    publishedAt: document.publishedAt,
  }
}

export class PayloadNyhetRepository {
  constructor(private readonly req: PayloadRequest) {}

  async lokallagExists(id: string): Promise<boolean> {
    const result = await this.req.payload.find({
      collection: 'lokallag',
      where: {
        id: {
          equals: id,
        },
      },
      limit: 1,
      depth: 0,
      req: this.req,
      overrideAccess: false,
    })

    return result.docs.length > 0
  }

  async findPublishedPage(query: NyhetPageQuery): Promise<NyhetPage> {
    const filters: Where[] = [
      { _status: { equals: 'published' } },
      { publishedAt: { less_than_equal: query.publishedAtOrBefore } },
    ]

    if (query.lokallagId !== undefined) {
      filters.push({
        lokallag: { equals: query.lokallagId },
      })
    }

    const result = await this.req.payload.find({
      collection: 'nyheter',
      where: { and: filters },
      page: query.page,
      limit: query.pageSize,
      sort: ['-publishedAt', 'id'],
      depth: 0,
      draft: false,
      req: this.req,
      overrideAccess: false,
    })

    return {
      items: result.docs.map(toNyhet),
      totalItems: result.totalDocs,
    }
  }
}
