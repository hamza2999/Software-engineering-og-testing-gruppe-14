// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadKursRepository } from '../../src/modules/kurs/adapters/PayloadKursRepository'
import type { Kur, User } from '../../src/payload-types'

let payload: Payload | undefined
let directory: string | undefined
let lagA: number
let lagB: number
let tomtLag: number
let editor: User
let token: string
let naa: Kur
let likDatoA: Kur
let likDatoB: Kur
let senere: Kur
let tidligere: Kur
let manglerPris: Kur
let manglerSted: Kur
let manglerLag: Kur
const cutoff = '2026-11-06T12:00:00.000Z'
const instanceKey = 'kurs-http-test'

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
    request: new Request(`http://localhost/api/kurs${path}`, { ...init, headers }),
  })
}

function writeRequest(path: string, method: string, data: Record<string, unknown>) {
  return request(path, true, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

function courseData() {
  // Tidligere dato holder kurs fra skrivetestene utenfor den faste oversiktslisten.
  return {
    title: 'Fiktivt testkurs',
    date: '2026-11-01T10:00:00.000Z',
    description: 'Fiktivt innhold.',
    location: 'Testveien 1',
    price: 15000,
    lokallag: lagA,
  }
}

function createCourse(
  data: Partial<ReturnType<typeof courseData>> & { image?: string | null } = {},
) {
  return app().create({
    collection: 'kurs',
    overrideAccess: true,
    depth: 0,
    data: { ...courseData(), ...data },
  })
}

function dto(kurs: Kur) {
  return {
    id: String(kurs.id),
    title: kurs.title,
    date: new Date(kurs.date).toISOString(),
    description: kurs.description,
    location: kurs.location,
    price: kurs.price,
    currency: 'NOK',
    image: kurs.image ?? null,
    lokallagId: String(kurs.lokallag),
  }
}

async function legacyCourse(data: Record<string, unknown>): Promise<Kur> {
  // Simulerer rader fra før B09. Migreringen gir nye felt NULL, uten å kjøre lagringshooken.
  const document = await app().db.create({
    collection: 'kurs',
    data: {
      title: 'Gammelt kurs',
      date: '2026-11-07T12:00:00.000Z',
      description: 'Eksisterende innhold.',
      lokallag: lagA,
      createdAt: cutoff,
      updatedAt: cutoff,
      ...data,
    },
  })
  return app().findByID({ collection: 'kurs', id: document.id, depth: 0, overrideAccess: true })
}

describe('B09: kurs gjennom HTTP-ruting og egen SQLite-testdatabase', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'kurs-http-test-'))
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-kurs-http-test-secret')
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
    const credentials = { email: 'kurs-http@example.test', password: 'kurs-http-test-password' }
    editor = await payload.create({ collection: 'users', overrideAccess: true, data: credentials })

    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      vi.setSystemTime(new Date(cutoff))
      senere = await createCourse({ title: 'Senere kurs', date: '2026-11-06T14:00:00.000Z' })
      naa = await createCourse({ title: 'Starter nå', date: cutoff, price: 0 })
      likDatoA = await createCourse({ title: 'Lik dato A', date: '2026-11-06T13:00:00.000Z' })
      likDatoB = await createCourse({
        title: 'Lik dato B',
        date: '2026-11-06T14:00:00+01:00',
        lokallag: lagB,
        price: 25000,
        image: 'https://example.test/kurs.jpg',
      })
      tidligere = await createCourse({ title: 'Tidligere kurs', date: '2026-11-06T11:00:00.000Z' })
      manglerPris = await legacyCourse({ location: 'Kjent sted', price: null })
      manglerSted = await legacyCourse({ location: null, price: 15000 })
      manglerLag = await legacyCourse({ location: 'Kjent sted', price: 15000, lokallag: null })
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

  it.each([false, true])(
    'gir kommende kurs i riktig rekkefølge og JSON-format, innlogget=%s',
    async (innlogget) => {
      const response = await request('/oversikt', innlogget)
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(await response.json()).toEqual({
        items: [naa, likDatoA, likDatoB, senere].map(dto),
        page: 1,
        pageSize: 20,
        totalItems: 4,
        totalPages: 1,
      })
    },
  )

  it('filtrerer på lokallag før paginering og beregner filtrerte totaler', async () => {
    const first = await request(`/oversikt?lokallagId=${lagA}&pageSize=2`)
    const second = await request(`/oversikt?lokallagId=${lagA}&pageSize=2&page=2`)
    expect(first.status).toBe(200)
    expect(await first.json()).toEqual({
      items: [naa, likDatoA].map(dto),
      page: 1,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    })
    expect(second.status).toBe(200)
    expect(await second.json()).toEqual({
      items: [dto(senere)],
      page: 2,
      pageSize: 2,
      totalItems: 3,
      totalPages: 2,
    })
    expect(await (await request(`/oversikt?lokallagId=${lagB}`)).json()).toEqual({
      items: [dto(likDatoB)],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    })
  })

  it('gir 200 og tom liste for tomt lokallag eller side etter siste treff', async () => {
    const empty = await request(`/oversikt?lokallagId=${tomtLag}`)
    expect(empty.status).toBe(200)
    expect(await empty.json()).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    })
    const beyond = await request('/oversikt?page=99&pageSize=2')
    expect(beyond.status).toBe(200)
    expect(await beyond.json()).toEqual({
      items: [],
      page: 99,
      pageSize: 2,
      totalItems: 4,
      totalPages: 2,
    })
  })

  it('bruker tidspunktet for hver forespørsel og kan ikke overstyres med klientparametere', async () => {
    const attemptedOverride = await request(
      '/oversikt?startsAtOrAfter=2000-01-01&where[date][less_than]=2000-01-01',
      true,
    )
    expect(await attemptedOverride.json()).toMatchObject({
      items: [naa, likDatoA, likDatoB, senere].map(dto),
      totalItems: 4,
    })
    vi.setSystemTime(new Date('2026-11-06T13:00:00.001Z'))
    expect(await (await request('/oversikt')).json()).toMatchObject({
      items: [dto(senere)],
      totalItems: 1,
    })
  })

  it.each([
    'page=0',
    'page=',
    'page=abc',
    'page=1.5',
    'pageSize=0',
    'pageSize=101',
    'page=9007199254740991&pageSize=100',
    'lokallagId=',
    'lokallagId=-1',
    'lokallagId=abc',
  ])('gir 400 for ugyldige parametere: %s', async (query) => {
    const response = await request(`/oversikt?${query}`)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: expect.any(String) })
  })

  it('gir 404 for ukjent lokallag', async () => {
    const response = await request(`/oversikt?lokallagId=${Number.MAX_SAFE_INTEGER}`)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Lokallaget finnes ikke.' })
  })

  it('viser både kommende og tidligere kurs i detaljformatet', async () => {
    for (const kurs of [naa, likDatoB, tidligere]) {
      const response = await request(`/detaljer/000${kurs.id}`)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual(dto(kurs))
    }
  })

  it.each(['0', '-1', 'abc', '1.5', '1e2', '1 ', '9007199254740992'])(
    'gir 400 for ugyldig kurs-ID: %j',
    async (id) => {
      const response = await request(`/detaljer/${encodeURIComponent(id)}`)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'id må være en positiv heltalls-ID.' })
    },
  )

  it.each([false, true])(
    'gir samme 404 for manglende og ufullstendige kurs, innlogget=%s',
    async (innlogget) => {
      for (const id of [Number.MAX_SAFE_INTEGER, manglerPris.id, manglerSted.id, manglerLag.id]) {
        const response = await request(`/detaljer/${id}`, innlogget)
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ error: 'Kurset finnes ikke.' })
      }
    },
  )

  it('lar innlogget bruker lese gamle data uten å gjøre ukjent pris til gratis', async () => {
    expect((await request(`/${manglerPris.id}`)).status).toBe(404)
    const response = await request(`/${manglerPris.id}`, true)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      id: manglerPris.id,
      price: null,
      location: 'Kjent sted',
    })
  })

  it.each([
    { field: 'price', value: undefined },
    { field: 'price', value: null },
    { field: 'price', value: -1 },
    { field: 'price', value: 1.5 },
    { field: 'price', value: Number.MAX_SAFE_INTEGER + 1 },
    { field: 'location', value: undefined },
    { field: 'location', value: '' },
    { field: 'location', value: '   ' },
    { field: 'lokallag', value: undefined },
    { field: 'lokallag', value: 0 },
    { field: 'lokallag', value: Number.MAX_SAFE_INTEGER },
  ])('avviser ugyldig $field ved lagring: $value', async ({ field, value }) => {
    const response = await writeRequest('', 'POST', { ...courseData(), [field]: value })
    expect(response.status).toBe(400)
  })

  it('lagrer pris i øre, trimmer sted og beholder verdier ved delvis oppdatering', async () => {
    const response = await writeRequest('', 'POST', {
      ...courseData(),
      location: '  Teststed  ',
      price: 0,
    })
    expect(response.status).toBe(201)
    const { doc } = await response.json()
    expect(doc).toMatchObject({ price: 0, location: 'Teststed' })
    const updated = await writeRequest(`/${doc.id}`, 'PATCH', { title: 'Endret tittel' })
    expect(updated.status).toBe(200)
    expect((await updated.json()).doc).toMatchObject({
      title: 'Endret tittel',
      price: 0,
      location: 'Teststed',
    })
    const cleared = await writeRequest(`/${doc.id}`, 'PATCH', { price: null })
    expect(cleared.status).toBe(400)
    expect(await (await request(`/detaljer/${doc.id}`)).json()).toMatchObject({
      price: 0,
      currency: 'NOK',
      location: 'Teststed',
    })
  })

  it('kan komplettere et gammelt kurs uten å endre ID og eksisterende innhold', async () => {
    const old = await legacyCourse({ date: '2026-10-01T12:00:00.000Z' })
    expect((await request(`/detaljer/${old.id}`)).status).toBe(404)
    const updated = await writeRequest(`/${old.id}`, 'PATCH', {
      location: 'Rettet sted',
      price: 12500,
    })
    expect(updated.status).toBe(200)
    const response = await request(`/detaljer/${old.id}`)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      id: String(old.id),
      title: old.title,
      description: old.description,
      date: old.date,
      location: 'Rettet sted',
      price: 12500,
      currency: 'NOK',
      lokallagId: String(lagA),
    })
  })

  it('skjuler kurs hvis lokallaget slettes', async () => {
    const lag = await app().create({
      collection: 'lokallag',
      overrideAccess: true,
      data: {
        name: 'Midlertidig lag',
        region: 'Test',
        description: 'Fiktivt lag',
        address: 'Testveien 2',
      },
    })
    const kurs = await createCourse({ lokallag: lag.id, date: '2026-11-07T12:00:00.000Z' })
    await app().delete({ collection: 'lokallag', id: lag.id, overrideAccess: true })
    expect((await request(`/detaljer/${kurs.id}`)).status).toBe(404)
    expect(await (await request('/oversikt')).json()).toMatchObject({ totalItems: 4 })
  })

  it('videresender brukeren og respekterer nektet lesetilgang', async () => {
    const collection = app().collections.kurs.config
    const original = collection.access.read
    collection.access.read = ({ req }) => req.user?.id === editor.id
    try {
      for (const path of ['/oversikt', `/detaljer/${naa.id}`]) {
        expect((await request(path, true)).status).toBe(200)
        const response = await request(path)
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ error: 'Ingen tilgang til å lese dataene.' })
      }
    } finally {
      collection.access.read = original
    }
  })

  it.each(['findUpcomingPage', 'findById'] as const)(
    'skjuler interne feil fra %s',
    async (method) => {
      vi.spyOn(PayloadKursRepository.prototype, method).mockRejectedValueOnce(
        new Error('Intern databaseinformasjon'),
      )
      vi.spyOn(app().logger, 'error').mockImplementation(() => undefined)
      const response = await request(
        method === 'findUpcomingPage' ? '/oversikt' : `/detaljer/${naa.id}`,
      )
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Kunne ikke hente data. Prøv igjen senere.' })
    },
  )

  it('beholder CORS-headere på både vellykkede svar og valideringsfeil', async () => {
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
