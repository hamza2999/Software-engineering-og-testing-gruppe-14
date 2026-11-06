export function isValidKursPrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isValidKursLocation(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function normalizeKursDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}
