export interface Kurs {
  id: string
  title: string
  date: string
  description: string
  location: string
  price: number
  currency: 'NOK'
  image: string | null
  lokallagId: string
}
