// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let payload: Payload | undefined
let directory: string | undefined
const instanceKey = 'lokallag-architecture-test'

async function requestOverview(query = '') {
  if (!payload) throw new Error('Testdatabasen er ikke startet')

  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: instanceKey,
    request: new Request(`http://localhost/api/lokallag/oversikt${query}`),
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
})
