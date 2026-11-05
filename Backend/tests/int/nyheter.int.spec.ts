// @vitest-environment node
import { getPayload, type Payload } from 'payload'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

let payload: Payload | undefined
let directory: string | undefined
const instanceKey = 'nyheter-publisering-test'

describe('Nyheter: publisering og lesetilgang', () => {
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

  it('oppretter utkast uten publiseringsdato', async () => {
    if (!payload) {
      throw new Error('Testdatabasen er ikke startet')
    }

    const nyhet = await payload.create({
      collection: 'nyheter',
      draft: true,
      overrideAccess: true,
      data: {
        title: 'En upublisert testnyhet',
        content: 'Fiktivt innhold til testen.',
        _status: 'draft',
      },
    })

    expect(nyhet._status).toBe('draft')
    expect(nyhet.publishedAt).toBeNull()
  })

  it('setter publiseringsdato ved første publisering', async () => {
    if (!payload) {
      throw new Error('Testdatabasen er ikke startet')
    }

    const nyhet = await payload.create({
      collection: 'nyheter',
      draft: true,
      overrideAccess: true,
      data: {
        title: 'Nyhet som skal publiseres',
        content: 'Fiktivt innhold til publiseringstesten.',
        _status: 'draft',
      },
    })

    const startTid = Date.now()

    const publisert = await payload.update({
      collection: 'nyheter',
      id: nyhet.id,
      draft: false,
      overrideAccess: true,
      data: {
        _status: 'published',
      },
    })

    const sluttTid = Date.now()

    expect(publisert._status).toBe('published')

    const publisertTid = Date.parse(publisert.publishedAt ?? '')
    expect(publisertTid).toBeGreaterThanOrEqual(startTid)
    expect(publisertTid).toBeLessThanOrEqual(sluttTid)
  })
})
