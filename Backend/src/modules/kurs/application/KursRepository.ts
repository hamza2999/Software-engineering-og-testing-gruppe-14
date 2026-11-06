import type { Kurs } from '../domain/Kurs'

export interface KursPageQuery {
  page: number
  pageSize: number
  lokallagId?: string
  startsAtOrAfter: string
}

export interface KursPage {
  items: Kurs[]
  totalItems: number
}

export interface KursRepository {
  findUpcomingPage(query: KursPageQuery): Promise<KursPage>
  findById(id: string): Promise<Kurs | null>
  lokallagExists(id: string): Promise<boolean>
}
