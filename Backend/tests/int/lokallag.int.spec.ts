// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { PayloadLokallagRepository } from '../../src/modules/lokallag/adapters/PayloadLokallagRepository'

let payload: Payload | undefined
let directory: string | undefined
const instanceKey = 'lokallag-architecture-test'

async function requestOverview(query = '') {
  return requestLokallag(`/oversikt${query}`)
}

async function requestLokallag(path: string) {
  if (!payload) throw new Error('Testdatabasen er ikke startet')

  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: instanceKey,
    request: new Request(`http://localhost/api/lokallag${path}`),
  })
}

describe('Lokallag HTTP → service → Payload → egen SQLite-testdatabase', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'lokallag-test-'))
    // Sett miljøet FØR konfigurasjonen importeres. Utviklingsdatabasen brukes ikke.
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-lokallag-integration-test-secret')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key: instanceKey })

    for (const name of ['B testlag', 'A testlag', 'C testlag']) {
      await payload.create({
        collection: 'lokallag',
        data: {
          name,
          region: 'Østfold',
          description: 'Fiktivt lokallag til automatisk test',
          address: 'Testveien 1',
          contactEmail: 'test@example.com',
        },
      })
    }
  }, 30_000)

  afterAll(async () => {
    try {
      await payload?.destroy()
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true })
      vi.unstubAllEnvs()
    }
  })

  it('ruter offentlig lesing og returnerer sorterte DTO-er med paginering', async () => {
    const response = await requestOverview('?page=2&pageSize=1')
    expect(response.status).toBe(200)

    expect(await response.json()).toEqual({
      items: [
        {
          id: expect.any(String),
          name: 'B testlag',
          region: 'Østfold',
          description: 'Fiktivt lokallag til automatisk test',
        },
      ],
      page: 2,
      pageSize: 1,
      totalItems: 3,
      totalPages: 3,
    })
  })

  it.each(['?page=0', '?pageSize=101', '?page=abc', '?page='])(
    'returnerer 400 ved ugyldige spørringsparametere: %s',
    async (query) => {
      const response = await requestOverview(query)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: expect.any(String) })
    },
  )

  it('returnerer en tom side når siden er etter siste treff', async () => {
    const response = await requestOverview('?page=4&pageSize=1')
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ items: [], totalItems: 3, page: 4 })
  })

  it('respekterer Payloads lesetilgang også gjennom den nye adapteren', async () => {
    const collection = payload!.collections.lokallag.config
    const originalRead = collection.access.read
    collection.access.read = () => false

    try {
      const response = await requestOverview()
      expect(response.status).toBe(403)
    } finally {
      collection.access.read = originalRead
    }
  })

  it('gir detalj-DTO med kontaktinformasjon og normalisert ID', async () => {
    const { docs } = await payload!.find({ collection: 'lokallag', sort: 'name', limit: 1 })
    const lag = docs[0]
    const response = await requestLokallag(`/detaljer/000${lag.id}`)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: String(lag.id),
      name: lag.name,
      region: lag.region,
      description: lag.description,
      address: lag.address,
      contactEmail: 'test@example.com',
      contactPhone: null,
    })
  })

  it.each(['0', '-1', 'abc', '1.5', '1 ', '9007199254740992'])(
    'avviser ugyldig detalj-ID: %j',
    async (id) => {
      const response = await requestLokallag(`/detaljer/${encodeURIComponent(id)}`)
      expect(response.status).toBe(400)
      expect(await response.json()).toEqual({ error: 'id må være en positiv heltalls-ID.' })
    },
  )

  it('gir 404 for et ukjent lokallag', async () => {
    const response = await requestLokallag(`/detaljer/${Number.MAX_SAFE_INTEGER}`)
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'Lokallaget finnes ikke.' })
  })

  it('respekterer nektet lesetilgang ved detaljoppslag', async () => {
    const collection = payload!.collections.lokallag.config
    const original = collection.access.read
    collection.access.read = () => false
    try {
      const response = await requestLokallag('/detaljer/1')
      expect(response.status).toBe(403)
      expect(await response.json()).toEqual({ error: 'Ingen tilgang til å lese dataene.' })
    } finally {
      collection.access.read = original
    }
  })

  it.each(['findPage', 'findById'] as const)('skjuler interne feil fra %s', async (method) => {
    const failure = vi
      .spyOn(PayloadLokallagRepository.prototype, method)
      .mockRejectedValueOnce(new Error('Intern feil'))
    const log = vi.spyOn(payload!.logger, 'error').mockImplementation(() => undefined)
    try {
      const response = await requestLokallag(method === 'findPage' ? '/oversikt' : '/detaljer/1')
      expect(response.status).toBe(500)
      expect(await response.json()).toEqual({ error: 'Kunne ikke hente data. Prøv igjen senere.' })
    } finally {
      failure.mockRestore()
      log.mockRestore()
    }
  })
})
