import type { Where } from 'payload'

export function completeKursFilters(): Where[] {
  return [
    { lokallag: { exists: true } },
    { location: { exists: true, not_equals: '' } },
    { price: { greater_than_equal: 0, less_than_equal: Number.MAX_SAFE_INTEGER } },
  ]
}
