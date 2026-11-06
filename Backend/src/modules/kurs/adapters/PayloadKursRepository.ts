import type { PayloadRequest, Where } from 'payload'

import type { Kur as PayloadKurs } from '../../../payload-types'
import type { KursPage, KursPageQuery, KursRepository } from '../application/KursRepository'
import type { Kurs } from '../domain/Kurs'
import { isValidKursLocation, isValidKursPrice } from '../domain/kursValidation'
import { completeKursFilters } from './kursReadFilters'

function toKurs(document: PayloadKurs): Kurs {
  const lokallagId =
    typeof document.lokallag === 'object' ? document.lokallag?.id : document.lokallag
  if (!lokallagId || !isValidKursLocation(document.location) || !isValidKursPrice(document.price)) {
    throw new Error('Kurset mangler gyldig lokallag, sted eller pris.')
  }
  return {
    id: String(document.id),
    title: document.title,
    date: new Date(document.date).toISOString(),
    description: document.description,
    location: document.location.trim(),
    price: document.price,
    currency: 'NOK',
    image: document.image?.trim() || null,
    lokallagId: String(lokallagId),
  }
}

export class PayloadKursRepository implements KursRepository {
  constructor(private readonly req: PayloadRequest) {}

  async lokallagExists(id: string): Promise<boolean> {
    const result = await this.req.payload.find({
      collection: 'lokallag',
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
      req: this.req,
      overrideAccess: false,
    })
    return result.docs.length > 0
  }

  async findUpcomingPage(query: KursPageQuery): Promise<KursPage> {
    const filters: Where[] = [
      ...completeKursFilters(),
      { date: { greater_than_equal: query.startsAtOrAfter } },
    ]
    if (query.lokallagId !== undefined) {
      filters.push({ lokallag: { equals: query.lokallagId } })
    }
    const result = await this.req.payload.find({
      collection: 'kurs',
      where: { and: filters },
      page: query.page,
      limit: query.pageSize,
      sort: ['date', 'id'],
      depth: 0,
      req: this.req,
      overrideAccess: false,
    })
    return { items: result.docs.map(toKurs), totalItems: result.totalDocs }
  }

  async findById(id: string): Promise<Kurs | null> {
    const result = await this.req.payload.find({
      collection: 'kurs',
      where: { and: [{ id: { equals: id } }, ...completeKursFilters()] },
      limit: 1,
      depth: 0,
      req: this.req,
      overrideAccess: false,
    })
    const document = result.docs[0]
    return document ? toKurs(document) : null
  }
}
