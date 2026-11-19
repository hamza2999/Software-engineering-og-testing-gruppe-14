import type { Nyhet } from '../domain/Nyhet'

export class NyhetDTO {
  readonly id: string
  readonly title: string
  readonly lokallagId: string
  readonly publishedAt: string

  constructor(nyhet: Nyhet) {
    this.id = nyhet.id
    this.title = nyhet.title
    this.lokallagId = nyhet.lokallagId
    this.publishedAt = nyhet.publishedAt
  }
}

export class NyhetDetailsDTO extends NyhetDTO {
  readonly content: string

  constructor(nyhet: Nyhet) {
    super(nyhet)
    this.content = nyhet.content
  }
}
