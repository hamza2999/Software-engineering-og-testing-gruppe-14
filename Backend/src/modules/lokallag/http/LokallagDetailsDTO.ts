import type { Lokallag } from '../domain/Lokallag'

export class LokallagDetailsDTO {
  readonly id: string
  readonly name: string
  readonly region: string
  readonly description: string
  readonly address: string
  readonly contactEmail: string | null
  readonly contactPhone: string | null

  constructor(lokallag: Lokallag) {
    this.id = lokallag.id
    this.name = lokallag.name
    this.region = lokallag.region
    this.description = lokallag.description
    this.address = lokallag.address
    this.contactEmail = lokallag.contactEmail
    this.contactPhone = lokallag.contactPhone
  }
}
