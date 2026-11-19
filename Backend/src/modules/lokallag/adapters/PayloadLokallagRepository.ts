import type { PayloadRequest } from 'payload'

import type { Lokallag as PayloadLokallag } from '../../../payload-types'
import type {
  LokallagPage,
  LokallagPageQuery,
  LokallagRepository,
} from '../application/LokallagRepository'
import type { Lokallag } from '../domain/Lokallag'

function toLokallag(document: PayloadLokallag): Lokallag {
  return {
    id: String(document.id),
    name: document.name,
    region: document.region,
    description: document.description,
    address: document.address,
    contactEmail: document.contactEmail ?? null,
    contactPhone: document.contactPhone ?? null,
  }
}

// Utgående adapter: bare denne datatilgangen kjenner Payloads spørringsformat.
export class PayloadLokallagRepository implements LokallagRepository {
  constructor(private readonly req: PayloadRequest) {}

  async findById(id: string): Promise<Lokallag | null> {
    const result = await this.req.payload.find({
      collection: 'lokallag',
      where: { id: { equals: id } },
      limit: 1,
      pagination: false,
      depth: 0,
      req: this.req,
      overrideAccess: false,
    })

    const document = result.docs[0]
    return document ? toLokallag(document) : null
  }

  async findPage({ page, pageSize }: LokallagPageQuery): Promise<LokallagPage> {
    const result = await this.req.payload.find({
      collection: 'lokallag',
      page,
      limit: pageSize,
      sort: ['name', 'id'],
      depth: 0,
      req: this.req,
      // Local API omgår ellers tilgangskontrollen som standard.
      overrideAccess: false,
    })

    return {
      items: result.docs.map(toLokallag),
      totalItems: result.totalDocs,
    }
  }
}
