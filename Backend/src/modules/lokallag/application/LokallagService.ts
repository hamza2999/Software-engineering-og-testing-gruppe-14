import type { LokallagPageQuery, LokallagRepository } from './LokallagRepository'

export class InvalidLokallagQueryError extends Error {}

export class LokallagService {
  // Dependency Injection: implementasjonen gis utenfra gjennom konstruktøren.
  constructor(private readonly repository: LokallagRepository) {}

  async list(query: Partial<LokallagPageQuery> = {}) {
    const { page = 1, pageSize = 20 } = query

    if (!Number.isSafeInteger(page) || page < 1) {
      throw new InvalidLokallagQueryError('page må være et positivt heltall.')
    }
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new InvalidLokallagQueryError('pageSize må være et heltall mellom 1 og 100.')
    }
    if (!Number.isSafeInteger((page - 1) * pageSize)) {
      throw new InvalidLokallagQueryError('Den valgte siden er for stor.')
    }

    const result = await this.repository.findPage({ page, pageSize })

    return {
      items: result.items,
      page,
      pageSize,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / pageSize),
    }
  }
}
