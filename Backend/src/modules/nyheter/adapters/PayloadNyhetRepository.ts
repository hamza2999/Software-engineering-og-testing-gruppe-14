import type { PayloadRequest, Where } from 'payload'
import type { Nyheter as PayloadNyhet } from '../../../payload-types'
import type { NyhetPage, NyhetPageQuery, NyhetRepository } from '../application/NyhetRepository'
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

function publishedFilters(publishedAtOrBefore: string): Where[] {
  return [
    { _status: { equals: 'published' } },
    { publishedAt: { less_than_equal: publishedAtOrBefore } },
    // En slettet lokallagskobling skal ikke gjøre hele nyhetsoversikten ugyldig.
    { lokallag: { exists: true } },
  ]
}

export class PayloadNyhetRepository implements NyhetRepository {
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
    const filters = publishedFilters(query.publishedAtOrBefore)

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

  async findPublishedById(id: string, publishedAtOrBefore: string): Promise<Nyhet | null> {
    const result = await this.req.payload.find({
      collection: 'nyheter',
      where: { and: [{ id: { equals: id } }, ...publishedFilters(publishedAtOrBefore)] },
      limit: 1,
      depth: 0,
      draft: false,
      req: this.req,
      overrideAccess: false,
    })

    const document = result.docs[0]
    return document ? toNyhet(document) : null
  }
}
