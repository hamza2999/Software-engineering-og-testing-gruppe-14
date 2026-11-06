import type { KursRepository } from './KursRepository'

export class InvalidKursQueryError extends Error {}

export class KursNotFoundError extends Error {
  constructor() {
    super('Kurset finnes ikke.')
  }
}

export class KursLokallagNotFoundError extends Error {
  constructor() {
    super('Lokallaget finnes ikke.')
  }
}

export interface KursListQuery {
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
    throw new InvalidKursQueryError(`${field} må være en positiv heltalls-ID.`)
  }
  return String(numericId)
}

export class KursService {
  constructor(
    private readonly repository: KursRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async list(query: KursListQuery = {}) {
    const { page = 1, pageSize = 20 } = query
    if (!Number.isSafeInteger(page) || page < 1) {
      throw new InvalidKursQueryError('page må være et positivt heltall.')
    }
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new InvalidKursQueryError('pageSize må være et heltall mellom 1 og 100.')
    }
    if (!Number.isSafeInteger((page - 1) * pageSize)) {
      throw new InvalidKursQueryError('Den valgte siden er for stor.')
    }

    const lokallagId =
      query.lokallagId === undefined ? undefined : normalizeId(query.lokallagId, 'lokallagId')
    const startsAtOrAfter = this.now().toISOString()
    if (lokallagId !== undefined && !(await this.repository.lokallagExists(lokallagId))) {
      throw new KursLokallagNotFoundError()
    }

    const result = await this.repository.findUpcomingPage({
      page,
      pageSize,
      lokallagId,
      startsAtOrAfter,
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
    // Tidligere kurs kan fortsatt ha en detaljside.
    const kurs = await this.repository.findById(normalizeId(id, 'id'))
    if (!kurs) throw new KursNotFoundError()
    return kurs
  }
}
