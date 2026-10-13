// Kjernens datamodell har ingen avhengighet til Payload eller SQLite.
export interface Lokallag {
  id: string
  name: string
  region: string
  description: string
  address: string
  contactEmail: string | null
  contactPhone: string | null
}
