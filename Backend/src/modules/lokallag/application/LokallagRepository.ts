import type { Lokallag } from '../domain/Lokallag'

export interface LokallagPageQuery {
  page: number
  pageSize: number
}

export interface LokallagPage {
  items: Lokallag[]
  totalItems: number
}

// Utgående port: kjernen bestemmer hva den trenger fra datalagringen.
export interface LokallagRepository {
  findPage(query: LokallagPageQuery): Promise<LokallagPage>
}
