// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { PayloadNyhetRepository } from '../../src/modules/nyheter/adapters/PayloadNyhetRepository'
import type { NyhetPageQuery } from '../../src/modules/nyheter/application/NyhetRepository'
import type { Nyheter, User } from '../../src/payload-types'

let payload: Payload | undefined
let directory: string | undefined
let lagA: number
let lagB: number
let tomtLag: number
let editor: User
let eldst: Nyheter
let nyest: Nyheter
let sammeDato: Nyheter
let annetLag: Nyheter

const cutoff = '2026-11-06T12:00:00.000Z'
const query: NyhetPageQuery = { page: 1, pageSize: 20, publishedAtOrBefore: cutoff }

function testPayload(): Payload {
  if (!payload) throw new Error('Testdatabasen er ikke startet')
  return payload
}

async function repository(user?: User) {
  const req = await createLocalReq({ user }, testPayload())
  return new PayloadNyhetRepository(req)
}

function createNewsAt(
  time: string,
  status: 'draft' | 'published',
  lokallag: number,
  title: string,
) {
  vi.setSystemTime(new Date(time))
  return testPayload().create({
    collection: 'nyheter',
    draft: status === 'draft',
    overrideAccess: true,
    data: { title, content: `Publisert innhold: ${title}`, lokallag, _status: status },
  })
}

describe('PayloadNyhetRepository med egen SQLite-testdatabase', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'nyhet-repository-test-'))
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-nyhet-repository-test-secret')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key: 'nyhet-repository-test' })

    const lagIds: number[] = []
    for (const name of ['Lag A', 'Lag B', 'Tomt lag']) {
      const lag = await payload.create({
        collection: 'lokallag',
        overrideAccess: true,
        data: { name, region: 'Test', description: 'Fiktivt testlag', address: 'Testveien 1' },
      })
      lagIds.push(lag.id)
    }
    ;[lagA, lagB, tomtLag] = lagIds

    editor = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: 'nyhet-repository@example.test', password: 'repository-test-only-password' },
    })

    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      // Den eldste opprettelsen publiseres sist, slik at testen skiller createdAt fra publishedAt.
      const utkast = await createNewsAt('2026-11-06T09:00:00.000Z', 'draft', lagA, 'Nyhet A1')
      eldst = await createNewsAt('2026-11-06T10:00:00.000Z', 'published', lagA, 'Eldste nyhet')
      annetLag = await createNewsAt('2026-11-06T11:00:00.000Z', 'published', lagB, 'Nyhet B')

      vi.setSystemTime(new Date(cutoff))
      nyest = await payload.update({
        collection: 'nyheter',
        id: utkast.id,
        draft: false,
        overrideAccess: true,
        data: { _status: 'published' },
      })
      sammeDato = await createNewsAt(cutoff, 'published', lagA, 'Nyhet A2')
      await createNewsAt(cutoff, 'draft', lagA, 'Utkast som skal skjules')
      await createNewsAt('2026-11-06T13:00:00.000Z', 'published', lagA, 'Framtidig nyhet')

      vi.setSystemTime(new Date('2026-11-06T12:30:00.000Z'))
      await payload.update({
        collection: 'nyheter',
        id: nyest.id,
        draft: true,
        overrideAccess: true,
        data: { content: 'Upublisert endring som skal skjules.', _status: 'draft' },
      })

      // En sen redigering skal heller ikke påvirke sorteringen etter publiseringsdato.
      vi.setSystemTime(new Date('2026-11-06T12:45:00.000Z'))
      await payload.update({
        collection: 'nyheter',
        id: eldst.id,
        overrideAccess: true,
        data: { content: 'Redigert innhold i den eldste nyheten.', _status: 'published' },
      })
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
    'henter offentlige versjoner fra alle lag og mapper domenefelt, innlogget=%s',
    async (innlogget) => {
      const repo = await repository(innlogget ? editor : undefined)
      const result = await repo.findPublishedPage(query)

      expect(result.totalItems).toBe(4)
      expect(result.items.map((nyhet) => nyhet.id)).toEqual(
        [nyest.id, sammeDato.id, annetLag.id, eldst.id].map(String),
      )
      expect(result.items[0]).toEqual({
        id: String(nyest.id),
        title: 'Nyhet A1',
        content: 'Publisert innhold: Nyhet A1',
        lokallagId: String(lagA),
        publishedAt: cutoff,
      })
    },
  )

  it('paginerer stabilt ved lik dato og beholder totalantallet på en side uten treff', async () => {
    const repo = await repository()
    const første = await repo.findPublishedPage({ ...query, pageSize: 2 })
    const andre = await repo.findPublishedPage({ ...query, page: 2, pageSize: 2 })
    const tredje = await repo.findPublishedPage({ ...query, page: 3, pageSize: 2 })

    expect(første.items.map((nyhet) => nyhet.id)).toEqual([nyest.id, sammeDato.id].map(String))
    expect(andre.items.map((nyhet) => nyhet.id)).toEqual([annetLag.id, eldst.id].map(String))
    expect(første.totalItems).toBe(4)
    expect(andre.totalItems).toBe(4)
    expect(tredje).toEqual({ items: [], totalItems: 4 })
  })

  it('filtrerer på lokallag før paginering og teller bare treff for valgt lag', async () => {
    const repo = await repository(editor)
    const første = await repo.findPublishedPage({ ...query, lokallagId: String(lagA), pageSize: 2 })
    const andre = await repo.findPublishedPage({
      ...query,
      lokallagId: String(lagA),
      page: 2,
      pageSize: 2,
    })
    const lagBResultat = await repo.findPublishedPage({ ...query, lokallagId: String(lagB) })

    expect(første.items.map((nyhet) => nyhet.id)).toEqual([nyest.id, sammeDato.id].map(String))
    expect(andre.items.map((nyhet) => nyhet.id)).toEqual([String(eldst.id)])
    expect(første.totalItems).toBe(3)
    expect(andre.totalItems).toBe(3)
    expect(lagBResultat.totalItems).toBe(1)
    expect(lagBResultat.items.map((nyhet) => nyhet.id)).toEqual([String(annetLag.id)])
  })

  it('gir tom liste for et eksisterende lag uten nyheter og skiller det fra et ukjent lag', async () => {
    const repo = await repository()
    expect(await repo.lokallagExists(String(tomtLag))).toBe(true)
    expect(await repo.lokallagExists(String(Number.MAX_SAFE_INTEGER))).toBe(false)
    expect(await repo.findPublishedPage({ ...query, lokallagId: String(tomtLag) })).toEqual({
      items: [],
      totalItems: 0,
    })
  })

  it('bruker den oppgitte tidsgrensen, inkludert nyheter publisert nøyaktig på grensen', async () => {
    const repo = await repository(editor)
    const result = await repo.findPublishedPage({
      ...query,
      publishedAtOrBefore: '2026-11-06T10:00:00.000Z',
    })
    expect(result.totalItems).toBe(1)
    expect(result.items.map((nyhet) => nyhet.id)).toEqual([String(eldst.id)])
  })

  it('videresender brukerkonteksten og respekterer nektet lesetilgang', async () => {
    const collection = testPayload().collections.nyheter.config
    const originalRead = collection.access.read
    collection.access.read = ({ req }) => req.user?.id === editor.id

    try {
      const innlogget = await repository(editor)
      expect((await innlogget.findPublishedPage(query)).totalItems).toBe(4)

      const anonym = await repository()
      await expect(anonym.findPublishedPage(query)).rejects.toMatchObject({ status: 403 })
    } finally {
      collection.access.read = originalRead
    }
  })
})
