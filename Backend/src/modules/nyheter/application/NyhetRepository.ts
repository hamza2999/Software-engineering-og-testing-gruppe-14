import type { Nyhet } from '../domain/Nyhet'

export interface NyhetPageQuery {
  page: number
  pageSize: number
  lokallagId?: string
  publishedAtOrBefore: string
}

export interface NyhetPage {
  items: Nyhet[]
  totalItems: number
}

export interface NyhetRepository {
  findPublishedPage(query: NyhetPageQuery): Promise<NyhetPage>
  findPublishedById(id: string, publishedAtOrBefore: string): Promise<Nyhet | null>
  lokallagExists(id: string): Promise<boolean>
}
