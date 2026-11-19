// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadNyhetRepository } from '../../src/modules/nyheter/adapters/PayloadNyhetRepository'
import type { Nyheter } from '../../src/payload-types'

let payload: Payload | undefined
let directory: string | undefined
let lagA: number
let lagB: number
let tomtLag: number
let token: string
let eldst: Nyheter
let nyest: Nyheter
let sammeDato: Nyheter
let annetLag: Nyheter
let utkast: Nyheter
let fremtidig: Nyheter
const instanceKey = 'nyhet-http-test'
const cutoff = '2026-11-06T12:00:00.000Z'

function app(): Payload {
  if (!payload) throw new Error('Testdatabasen er ikke startet')
  return payload
}

function request(path: string, innlogget = false, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (innlogget) headers.set('Authorization', `JWT ${token}`)
  return handleEndpoints({
    config: app().config,
    payloadInstanceCacheKey: instanceKey,
    request: new Request(`http://localhost/api/nyheter${path}`, { ...init, headers }),
  })
}

function overview(nyhet: Nyheter) {
  return {
    id: String(nyhet.id),
    title: nyhet.title,
    lokallagId: String(nyhet.lokallag),
    publishedAt: nyhet.publishedAt,
  }
}

function createAt(
  time: string,
  lokallag: number,
  title: string,
  status: 'draft' | 'published' = 'published',
) {
  vi.setSystemTime(new Date(time))
  return app().create({
    collection: 'nyheter',
    depth: 0,
    draft: status === 'draft',
    overrideAccess: true,
    data: { title, content: `Innhold: ${title}`, lokallag, _status: status },
  })
}

describe('B08: nyhets-API gjennom Payloads HTTP-ruting og egen database', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'nyhet-http-test-'))
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-nyhet-http-test-secret')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key: instanceKey })

    const ids: number[] = []
    for (const name of ['Lag A', 'Lag B', 'Tomt lag']) {
      const lag = await payload.create({
        collection: 'lokallag',
        overrideAccess: true,
        data: { name, region: 'Test', description: 'Fiktivt lag', address: 'Testveien 1' },
      })
      ids.push(lag.id)
    }
    ;[lagA, lagB, tomtLag] = ids
    const credentials = { email: 'nyhet-http@example.test', password: 'nyhet-http-test-password' }
    await payload.create({ collection: 'users', overrideAccess: true, data: credentials })

    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      eldst = await createAt('2026-11-06T10:00:00.000Z', lagA, 'Eldst')
      annetLag = await createAt('2026-11-06T10:30:00.000Z', lagB, 'Annet lag')
      nyest = await createAt('2026-11-06T11:00:00.000Z', lagA, 'Nyest A')
      sammeDato = await createAt('2026-11-06T11:00:00.000Z', lagA, 'Nyest B')
      utkast = await createAt(cutoff, lagA, 'Skjult utkast', 'draft')
      fremtidig = await createAt('2026-11-06T13:00:00.000Z', lagA, 'Framtidig')
      vi.setSystemTime(new Date(cutoff))
      await payload.update({
        collection: 'nyheter',
        id: nyest.id,
        draft: true,
        overrideAccess: true,
        data: { content: 'Upublisert endring.', _status: 'draft' },
      })
      const login = await payload.login({ collection: 'users', data: credentials })
      if (!login.token) throw new Error('Innlogging til testen ga ingen token')
      token = login.token
    } finally {
      vi.useRealTimers()
    }
  }, 30_000)

  beforeEach(() => {
    expect.hasAssertions()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(cutoff))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    vi.useRealTimers()
    try {
      await payload?.destroy()
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true })
      vi.unstubAllEnvs()
    }
  })

  it('returnerer avtalte oversiktsfelt og bare publiserte nyheter, nyeste først', async () => {
    const response = await request('/oversikt')
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({
      items: [nyest, sammeDato, annetLag, eldst].map(overview),
      page: 1,
      pageSize: 20,
      totalItems: 4,
      totalPages: 1,
    })
  })

  it('paginerer og filtrerer før totalantall og antall sider beregnes', async () => {
    const response = await request('/oversikt?page=2&pageSize=2')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [annetLag, eldst].map(overview),
      page: 2,
      pageSize: 2,
      totalItems: 4,
      totalPages: 2,
    })
    const filtered = await request(`/oversikt?lokallagId=${lagA}&page=2&pageSize=2`)
    expect(filtered.status).toBe(200)
    expect(await filtered.json()).toEqual({
      items: [overview(eldst)],
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    })
    const other = await request(`/oversikt?lokallagId=${lagB}`)
    expect(await other.json()).toEqual({
      items: [overview(annetLag)],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    })
  })

  it('returnerer 200 for tomt lokallag og for en side etter siste treff', async () => {
    const empty = await request(`/oversikt?lokallagId=${tomtLag}`)
    expect(empty.status).toBe(200)
    expect(await empty.json()).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    })
    const beyond = await request(`/oversikt?lokallagId=${lagA}&page=99&pageSize=2`)
    expect(beyond.status).toBe(200)
    expect(await beyond.json()).toEqual({
      items: [],
      page: 99,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    })
  })

  it.each([
    'page=0',
    'page=',
    'page=abc',
    'page=1.5',
    'pageSize=101',
    'pageSize=0',
    'page=9007199254740991&pageSize=100',
    'lokallagId=',
    'lokallagId=abc',
    'lokallagId=-1',
  ])('returnerer JSON-feil med 400 for ugyldig spørring: %s', async (query) => {
    const response = await request(`/oversikt?${query}`)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: expect.any(String) })
  })

  it('returnerer 404 for et ukjent lokallagsfilter', async () => {
    const response = await request(`/oversikt?lokallagId=${Number.MAX_SAFE_INTEGER}`)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Lokallaget finnes ikke.' })
  })

  it.each([false, true])('returnerer offentlig detalj-DTO, innlogget=%s', async (innlogget) => {
    const response = await request(`/detaljer/000${nyest.id}?draft=true&depth=2`, innlogget)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ...overview(nyest), content: nyest.content })
  })

  it.each([false, true])(
    'gir samme 404 for utkast, framtidig og ukjent ID, innlogget=%s',
    async (innlogget) => {
      for (const id of [utkast.id, fremtidig.id, Number.MAX_SAFE_INTEGER]) {
        const response = await request(`/detaljer/${id}?draft=true`, innlogget)
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ error: 'Nyheten finnes ikke.' })
      }
    },
  )

  it.each(['0', '-1', 'abc', '1.5', '1e2', '1 ', '9007199254740992'])(
    'returnerer 400 for ugyldig detalj-ID: %j',
    async (id) => {
      const response = await request(`/detaljer/${encodeURIComponent(id)}`)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'id må være en positiv heltalls-ID.' })
    },
  )

  it('beholder offentlig filtrering selv for innlogget bruker med tilgang til utkast', async () => {
    const raw = await request(`/${utkast.id}`, true)
    expect(raw.status).toBe(200)
    expect(await raw.json()).toMatchObject({ id: utkast.id, _status: 'draft' })

    const response = await request(
      '/oversikt?draft=true&publishedAtOrBefore=2099-01-01&where[_status][equals]=draft',
      true,
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [nyest, sammeDato, annetLag, eldst].map(overview),
      page: 1,
      pageSize: 20,
      totalItems: 4,
      totalPages: 1,
    })
  })

  it('beskytter versjonshistorikken mot anonyme forespørsler', async () => {
    expect((await request('/versions')).status).toBe(403)
    expect((await request('/versions', true)).status).toBe(200)
  })

  it('tillater et ufullstendig utkast, men krever lokallag før publisering', async () => {
    const response = await request('?draft=true', true, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Utkast uten lokallag',
        content: 'Fiktivt innhold.',
        _status: 'draft',
      }),
    })
    expect(response.status).toBe(201)
    const { doc } = await response.json()
    const published = await request(`/${doc.id}`, true, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _status: 'published' }),
    })
    expect(published.status).toBe(400)
    expect((await request(`/detaljer/${doc.id}`)).status).toBe(404)
  })

  it('skjuler nyheter som har mistet lokallagskoblingen', async () => {
    const lag = await app().create({
      collection: 'lokallag',
      overrideAccess: true,
      data: {
        name: 'Lag som slettes',
        region: 'Test',
        address: 'Testveien 2',
        description: 'Fiktivt lag',
      },
    })
    const nyhet = await createAt(cutoff, lag.id, 'Nyhet fra slettet lag')
    await app().delete({ collection: 'lokallag', id: lag.id, overrideAccess: true })
    expect((await request(`/detaljer/${nyhet.id}`)).status).toBe(404)
    const response = await request('/oversikt')
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.items.map((item: { id: string }) => item.id)).not.toContain(String(nyhet.id))
    expect(body.totalItems).toBe(4)
  })

  it('returnerer 403 når samlingens lesetilgang nektes', async () => {
    const collection = app().collections.nyheter.config
    const original = collection.access.read
    collection.access.read = () => false
    try {
      for (const path of ['/oversikt', `/detaljer/${nyest.id}`]) {
        const response = await request(path)
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ error: 'Ingen tilgang til å lese dataene.' })
      }
    } finally {
      collection.access.read = original
    }
  })

  it.each(['findPublishedPage', 'findPublishedById'] as const)(
    'returnerer en generell 500-feil ved feil i %s',
    async (method) => {
      vi.spyOn(PayloadNyhetRepository.prototype, method).mockRejectedValueOnce(
        new Error('Intern databaseinformasjon'),
      )
      vi.spyOn(app().logger, 'error').mockImplementation(() => undefined)
      const path = method === 'findPublishedPage' ? '/oversikt' : `/detaljer/${nyest.id}`
      const response = await request(path)
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Kunne ikke hente data. Prøv igjen senere.' })
    },
  )

  it('beholder CORS-headere også i valideringsfeil', async () => {
    const original = app().config.cors
    const origin = 'http://localhost:5173'
    app().config.cors = [origin]
    try {
      for (const path of ['/oversikt', '/oversikt?page=0']) {
        const response = await request(path, false, { headers: { Origin: origin } })
        expect(response.headers.get('access-control-allow-origin')).toBe(origin)
      }
    } finally {
      app().config.cors = original
    }
  })
})
