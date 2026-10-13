import type { PayloadRequest } from 'payload'

import type {
  LokallagPage,
  LokallagPageQuery,
  LokallagRepository,
} from '../application/LokallagRepository'

// Utgående adapter: bare denne datatilgangen kjenner Payloads spørringsformat.
export class PayloadLokallagRepository implements LokallagRepository {
  constructor(private readonly req: PayloadRequest) {}

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
      items: result.docs.map((document) => ({
        id: String(document.id),
        name: document.name,
        region: document.region,
        description: document.description,
        address: document.address,
        contactEmail: document.contactEmail ?? null,
        contactPhone: document.contactPhone ?? null,
      })),
      totalItems: result.totalDocs,
    }
  }
}
