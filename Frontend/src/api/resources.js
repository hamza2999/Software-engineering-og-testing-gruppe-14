const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const text = (value) => typeof value === 'string'
const id = (value) => text(value) && value.length > 0
const nullableText = (value) => value === null || text(value)
const timestamp = (value) => text(value) && Number.isFinite(Date.parse(value))

export const isLokallag = (value) =>
  record(value) && id(value.id) && text(value.name) && text(value.region) && text(value.description)
export const isLokallagDetails = (value) =>
  isLokallag(value) &&
  text(value.address) &&
  nullableText(value.contactEmail) &&
  nullableText(value.contactPhone)
export const isNyhet = (value) =>
  record(value) &&
  id(value.id) &&
  text(value.title) &&
  id(value.lokallagId) &&
  timestamp(value.publishedAt)
export const isNyhetDetails = (value) => isNyhet(value) && text(value.content)
export const isKurs = (value) =>
  record(value) &&
  id(value.id) &&
  text(value.title) &&
  text(value.description) &&
  timestamp(value.date) &&
  text(value.location) &&
  Number.isSafeInteger(value.price) &&
  value.price >= 0 &&
  value.currency === 'NOK' &&
  nullableText(value.image) &&
  id(value.lokallagId)

function pageOf(item) {
  return (value) =>
    record(value) &&
    Array.isArray(value.items) &&
    value.items.every(item) &&
    Number.isSafeInteger(value.page) &&
    value.page >= 1 &&
    Number.isSafeInteger(value.pageSize) &&
    value.pageSize >= 1 &&
    value.pageSize <= 100 &&
    Number.isSafeInteger(value.totalItems) &&
    value.totalItems >= 0 &&
    value.totalPages === Math.ceil(value.totalItems / value.pageSize) &&
    value.items.length <= value.pageSize
}

export const isLokallagPage = pageOf(isLokallag)
export const isNyhetPage = pageOf(isNyhet)
export const isKursPage = pageOf(isKurs)
