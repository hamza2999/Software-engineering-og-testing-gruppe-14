// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

let payload: Payload | undefined
let directory: string | undefined
const key = 'isolated-health-test'

async function request() {
  if (!payload) throw new Error('Testdatabasen er ikke startet')
  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: key,
    request: new Request('http://localhost/api/health'),
  })
}

describe('Healthcheck med isolert database', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'health-test-'))
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-health-test-secret')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key })
  }, 30_000)
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => {
    try {
      await payload?.destroy()
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true })
      vi.unstubAllEnvs()
    }
  })
  it('gir 200 uten brukerdata når databasen kan leses', async () => {
    const response = await request()
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ status: 'ok' })
  })
  it('gir 503 uten interne feildetaljer ved databasefeil', async () => {
    vi.spyOn(payload!, 'count').mockRejectedValueOnce(new Error('Intern databaseinformasjon'))
    vi.spyOn(payload!.logger, 'error').mockImplementation(() => undefined)
    const response = await request()
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ status: 'unavailable' })
  })
})
