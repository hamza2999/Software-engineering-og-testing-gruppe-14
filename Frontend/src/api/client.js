export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

export function apiUrl(path, params = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) query.set(key, String(value))
  }
  return `${base}${path}${query.size ? `?${query}` : ''}`
}

export async function getJson(url, validate, signal) {
  let response
  try {
    response = await fetch(url, { credentials: 'include', cache: 'no-store', signal })
  } catch (error) {
    if (signal?.aborted || error?.name === 'AbortError') throw error
    throw new ApiError('Fikk ikke kontakt med serveren. Prøv igjen.')
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      response.status === 400
        ? 'Lenken eller valget er ugyldig. Velg fra oversikten.'
        : typeof data?.error === 'string' && response.status < 500
          ? data.error
          : 'Kunne ikke hente data. Prøv igjen.'
    throw new ApiError(message, response.status)
  }
  if (!validate(data)) throw new ApiError('Kunne ikke lese svaret fra serveren. Prøv igjen.')
  return data
}

export async function getAllPages(url, validate, signal) {
  const first = await getJson(url, validate, signal)
  const items = [...first.items]
  for (let page = 2; page <= first.totalPages; page += 1) {
    signal?.throwIfAborted()
    const next = new URL(url, 'http://local')
    next.searchParams.set('page', String(page))
    next.searchParams.set('pageSize', String(first.pageSize))
    const nextUrl = url.startsWith('/') ? `${next.pathname}${next.search}` : next.toString()
    const result = await getJson(nextUrl, validate, signal)
    if (result.page !== page) throw new ApiError('Kunne ikke lese svaret fra serveren. Prøv igjen.')
    items.push(...result.items)
  }
  return items
}
