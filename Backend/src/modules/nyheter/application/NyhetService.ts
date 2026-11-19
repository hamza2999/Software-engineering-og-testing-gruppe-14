import type { NyhetRepository } from './NyhetRepository'

export class InvalidNyhetQueryError extends Error {}

export class NyhetNotFoundError extends Error {
  constructor() {
    super('Nyheten finnes ikke.')
  }
}

export class NyhetLokallagNotFoundError extends Error {
  constructor() {
    super('Lokallaget finnes ikke.')
  }
}

export interface NyhetListQuery {
  page?: number
  pageSize?: number
  lokallagId?: string
}

function normalizeId(id: string, field: 'id' | 'lokallagId'): string {
  const numericId = Number(id)
  if (
    typeof id !== 'string' ||
    id !== id.trim() ||
    !/^\d+$/.test(id) ||
    !Number.isSafeInteger(numericId) ||
    numericId < 1
  ) {
    throw new InvalidNyhetQueryError(`${field} må være en positiv heltalls-ID.`)
  }
  return String(numericId)
}

export class NyhetService {
  constructor(
    private readonly repository: NyhetRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: NyhetListQuery = {}) {
    const { page = 1, pageSize = 20 } = query
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new InvalidNyhetQueryError('page må være et positivt heltall.')
    }
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new InvalidNyhetQueryError('pageSize må være et heltall mellom 1 og 100.')
    }
    if (!Number.isSafeInteger((page - 1) * pageSize)) {
      throw new InvalidNyhetQueryError('Den valgte siden er for stor.')
    }

    const lokallagId =
      query.lokallagId === undefined ? undefined : normalizeId(query.lokallagId, 'lokallagId')
    const publishedAtOrBefore = this.now().toISOString()

    if (lokallagId !== undefined && !(await this.repository.lokallagExists(lokallagId))) {
      throw new NyhetLokallagNotFoundError()
    }

    const result = await this.repository.findPublishedPage({
      page,
      pageSize,
      lokallagId,
      publishedAtOrBefore,
    })

    return {
      items: result.items,
      page,
      pageSize,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / pageSize),
    }
  }

  async getById(id: string) {
    const normalizedId = normalizeId(id, 'id')
    const nyhet = await this.repository.findPublishedById(normalizedId, this.now().toISOString())
    if (!nyhet) throw new NyhetNotFoundError()
    return nyhet
  }
}
