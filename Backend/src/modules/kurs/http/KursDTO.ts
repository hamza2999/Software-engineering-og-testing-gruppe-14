import type { Kurs } from '../domain/Kurs'

export class KursDTO {
  readonly id: string
  readonly title: string
  readonly date: string
  readonly description: string
  readonly location: string
  readonly price: number
  readonly currency: 'NOK'
  readonly image: string | null
  readonly lokallagId: string

  constructor(kurs: Kurs) {
    this.id = kurs.id
    this.title = kurs.title
    this.date = kurs.date
    this.description = kurs.description
    this.location = kurs.location
    this.price = kurs.price
    this.currency = kurs.currency
    this.image = kurs.image
    this.lokallagId = kurs.lokallagId
  }
}
