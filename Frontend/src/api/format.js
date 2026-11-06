const dateFormat = new Intl.DateTimeFormat('nb-NO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Europe/Oslo',
})
const moneyFormat = new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' })

export function formatDateTime(value) {
  return dateFormat.format(new Date(value))
}

export function formatPrice(price) {
  return price === 0 ? 'Gratis' : moneyFormat.format(price / 100)
}
