import assert from 'node:assert/strict'
import { afterEach, mock, test } from 'node:test'
import { ApiError, apiUrl, getAllPages, getJson } from '../src/api/client.js'
import { isKurs, isLokallagDetails, isLokallagPage, isNyhetDetails } from '../src/api/resources.js'
import { formatDateTime, formatPrice } from '../src/api/format.js'

afterEach(() => mock.restoreAll())

const group = { id: '1', name: 'Testlag', region: 'Østfold', description: 'Fiktivt lag' }
const page = (items, pageNumber = 1, totalItems = items.length) => ({
  items,
  page: pageNumber,
  pageSize: 1,
  totalItems,
  totalPages: totalItems,
})

test('bygger URL med kodede parametere og utelater valgfrie verdier', () => {
  assert.equal(
    apiUrl('/kurs/oversikt', { page: 2, lokallagId: undefined }),
    '/api/kurs/oversikt?page=2',
  )
  assert.equal(
    apiUrl('/nyheter/oversikt', { lokallagId: '1&draft=true' }),
    '/api/nyheter/oversikt?lokallagId=1%26draft%3Dtrue',
  )
})

test('henter og validerer JSON med cookies, abortsignal og uten nettlesercache', async () => {
  const fetch = mock.method(globalThis, 'fetch', async () => Response.json(page([group])))
  const controller = new AbortController()
  assert.deepEqual(
    await getJson('/api/lokallag/oversikt', isLokallagPage, controller.signal),
    page([group]),
  )
  assert.equal(fetch.mock.calls[0].arguments[1].credentials, 'include')
  assert.equal(fetch.mock.calls[0].arguments[1].signal, controller.signal)
  assert.equal(fetch.mock.calls[0].arguments[1].cache, 'no-store')
})

test('tomt svar er gyldige data', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json(page([])))
  assert.deepEqual(await getAllPages('/api/lokallag/oversikt', isLokallagPage), [])
})

test('henter alle sider slik at søk dekker mer enn første API-side', async () => {
  const fetch = mock.method(globalThis, 'fetch', async (url) => {
    const current = Number(new URL(url, 'http://local').searchParams.get('page') || 1)
    return Response.json(page([{ ...group, id: String(current) }], current, 3))
  })
  const groups = await getAllPages('/api/lokallag/oversikt?pageSize=1', isLokallagPage)
  assert.deepEqual(
    groups.map((item) => item.id),
    ['1', '2', '3'],
  )
  assert.equal(fetch.mock.callCount(), 3)
})

test('feil på en senere side gir feil fremfor en ufullstendig søkeresultatliste', async () => {
  mock.method(globalThis, 'fetch', async (url) =>
    url.includes('page=2')
      ? Response.json({ error: 'Feil' }, { status: 500 })
      : Response.json(page([group], 1, 2)),
  )
  await assert.rejects(
    getAllPages('/api/lokallag/oversikt', isLokallagPage),
    (error) => error.status === 500,
  )
})

test('avviser en server som gjentar feil sidetall', async () => {
  mock.method(globalThis, 'fetch', async () => Response.json(page([group], 1, 2)))
  await assert.rejects(getAllPages('/api/lokallag/oversikt', isLokallagPage), ApiError)
})

test('beholder 404-status for detaljsidens ikke-funnet-visning', async () => {
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Nyheten finnes ikke.' }, { status: 404 }),
  )
  await assert.rejects(
    getJson('/api/nyheter/detaljer/42', isNyhetDetails),
    (error) => error.status === 404,
  )
})

test('viser en generell melding for serverfeil uten å eksponere intern feiltekst', async () => {
  mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: 'Intern SQL-informasjon' }, { status: 500 }),
  )
  await assert.rejects(
    getJson('/api/kurs/detaljer/1', isKurs),
    (error) => error.status === 500 && !error.message.includes('SQL'),
  )
})

test('håndterer nettverksfeil', async () => {
  mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Failed to fetch')
  })
  await assert.rejects(
    getJson('/api/kurs/detaljer/1', isKurs),
    (error) => error instanceof ApiError && error.status === 0,
  )
})

test('bevarer kansellering som kansellering', async () => {
  mock.method(
    globalThis,
    'fetch',
    (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      }),
  )
  const controller = new AbortController()
  const result = getJson('/api/kurs/detaljer/1', isKurs, controller.signal)
  controller.abort()
  await assert.rejects(result, { name: 'AbortError' })
})

for (const body of ['<html>En feilside</html>', '{}', '{"items":[null]}']) {
  test(`avviser ugyldig API-svar: ${body}`, async () => {
    mock.method(globalThis, 'fetch', async () => new Response(body))
    await assert.rejects(getJson('/api/lokallag/oversikt', isLokallagPage), ApiError)
  })
}

test('validerer lokallagsdetaljer med valgfrie kontaktfelt', () => {
  assert.equal(
    isLokallagDetails({ ...group, address: 'Testveien 1', contactEmail: null, contactPhone: null }),
    true,
  )
  assert.equal(isLokallagDetails(group), false)
})

test('krever en eksplisitt pris og støtter gratis kurs', () => {
  const course = {
    id: '1',
    title: 'Kurs',
    description: 'Test',
    date: '2026-11-06T12:00:00Z',
    location: 'Testveien 1',
    price: 0,
    currency: 'NOK',
    image: null,
    lokallagId: '1',
  }
  assert.equal(isKurs(course), true)
  assert.equal(isKurs({ ...course, price: null }), false)
  assert.equal(isKurs({ ...course, price: 1.5 }), false)
  assert.equal(isKurs({ ...course, currency: 'USD' }), false)
})

test('viser øre som kroner og tidspunkt i Europe/Oslo', () => {
  assert.equal(formatPrice(0), 'Gratis')
  assert.equal(formatPrice(15000).replace(/[^0-9,]/g, ''), '150,00')
  assert.equal(formatPrice(1).replace(/[^0-9,]/g, ''), '0,01')
  assert.match(formatDateTime('2026-11-06T12:00:00Z'), /13:00/)
})
