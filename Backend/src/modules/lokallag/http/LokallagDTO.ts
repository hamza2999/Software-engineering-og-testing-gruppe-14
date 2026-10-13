import type { Lokallag } from '../domain/Lokallag'

// Kontrakten for oversikten inneholder bare feltene medlemsgruppelisten trenger.
export class LokallagDTO {
  readonly id: string
  readonly name: string
  readonly region: string
  readonly description: string

  constructor(lokallag: Lokallag) {
    this.id = lokallag.id
    this.name = lokallag.name
    this.region = lokallag.region
    this.description = lokallag.description
  }
}
