// @vitest-environment node
import { getPayload, handleEndpoints, type Payload } from 'payload'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Nyheter, User } from '../../src/payload-types'

let payload: Payload | undefined
let directory: string | undefined
let lokallagId: number
let editor: User
const instanceKey = 'nyheter-publisering-test'

function testPayload(): Payload {
  if (!payload) throw new Error('Testdatabasen er ikke startet')
  return payload
}

// Opprettelsen er testoppsett. Lesetilgang testes separat gjennom HTTP eller overrideAccess: false.
function createNews(status: 'draft' | 'published', content = 'Fiktivt nyhetsinnhold.') {
  return testPayload().create({
    collection: 'nyheter',
    draft: status === 'draft',
    overrideAccess: true,
    data: {
      title: 'Fiktiv testnyhet',
      content,
      lokallag: lokallagId,
      _status: status,
    },
  })
}

function requestNews(path: string) {
  return handleEndpoints({
    config: testPayload().config,
    payloadInstanceCacheKey: instanceKey,
    request: new Request(`http://localhost/api/nyheter${path}`),
  })
}

function requestNewsList(ids: number[], draft = false) {
  // Avgrens til denne testens poster, slik at testene kan kjøres uavhengig av rekkefølge.
  const query = new URLSearchParams({ 'where[id][in]': ids.join(','), depth: '0' })
  if (draft) query.set('draft', 'true')
  return requestNews(`?${query}`)
}

describe('Nyheter: publisering og lesetilgang', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'nyheter-test-'))
    // Sett miljøet FØR konfigurasjonen importeres. Utviklingsdatabasen brukes ikke.
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'isolated-nyheter-integration-test-secret')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key: instanceKey })

    const lokallag = await payload.create({
      collection: 'lokallag',
      overrideAccess: true,
      data: {
        name: 'Testlag for nyheter',
        region: 'Østfold',
        description: 'Fiktivt lokallag til automatisk test',
        address: 'Testveien 1',
      },
    })
    lokallagId = lokallag.id

    editor = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email: 'nyhetstest@example.test',
        password: 'nyheter-test-only-password',
      },
    })
  }, 30_000)

  beforeEach(() => {
    // En test som bare oppretter data, skal ikke bli grønn uten noen kontroller.
    expect.hasAssertions()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
        lokallag: lokallagId,
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
        lokallag: lokallagId,
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

  it.each([
    { scenario: 'vanlig redigering', publishedAt: undefined },
    { scenario: 'innsendt ny dato', publishedAt: '2026-11-06T12:00:00.000Z' },
    { scenario: 'forsøk på å tømme datoen', publishedAt: null },
  ])('beholder første publiseringsdato ved $scenario', async ({ publishedAt }) => {
    const førsteTidspunkt = '2026-11-05T10:00:00.000Z'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(førsteTidspunkt))

    const nyhet = await createNews('published')
    expect(nyhet.publishedAt).toBe(førsteTidspunkt)

    vi.setSystemTime(new Date('2026-11-05T11:00:00.000Z'))
    const oppdatert = await testPayload().update({
      collection: 'nyheter',
      id: nyhet.id,
      overrideAccess: true,
      data: { title: 'Endret tittel', _status: 'published', publishedAt },
    })

    expect(oppdatert.title).toBe('Endret tittel')
    expect(oppdatert._status).toBe('published')
    expect(oppdatert.publishedAt).toBe(førsteTidspunkt)
  })

  it('skjuler en avpublisert nyhet og beholder datoen når den publiseres igjen', async () => {
    const førsteTidspunkt = '2026-11-05T10:00:00.000Z'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(førsteTidspunkt))
    const nyhet = await createNews('published')
    expect(nyhet.publishedAt).toBe(førsteTidspunkt)

    vi.setSystemTime(new Date('2026-11-05T11:00:00.000Z'))
    const avpublisert = await testPayload().update({
      collection: 'nyheter',
      id: nyhet.id,
      draft: false,
      overrideAccess: true,
      data: { _status: 'draft' },
    })

    expect(avpublisert._status).toBe('draft')
    expect(avpublisert.publishedAt).toBe(førsteTidspunkt)
    expect((await requestNews(`/${nyhet.id}`)).status).toBe(404)

    vi.setSystemTime(new Date('2026-11-05T12:00:00.000Z'))
    const publisertIgjen = await testPayload().update({
      collection: 'nyheter',
      id: nyhet.id,
      draft: false,
      overrideAccess: true,
      data: { _status: 'published' },
    })

    expect(publisertIgjen._status).toBe('published')
    expect(publisertIgjen.publishedAt).toBe(førsteTidspunkt)
    expect((await requestNews(`/${nyhet.id}`)).status).toBe(200)
  })

  it.each([false, true])(
    'viser bare offentlige nyheter i anonym HTTP-liste, draft=%s',
    async (draft) => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-11-05T11:00:00.000Z'))
      const fremtidig = await createNews('published', 'Innhold med framtidig publiseringsdato.')

      vi.setSystemTime(new Date('2026-11-05T10:00:00.000Z'))
      const publisert = await createNews('published', 'Offentlig innhold.')
      const utkast = await createNews('draft', 'Upublisert innhold.')

      const response = await requestNewsList([publisert.id, utkast.id, fremtidig.id], draft)
      expect(response.status).toBe(200)

      const body = (await response.json()) as { docs: Nyheter[]; totalDocs: number }
      expect(body.totalDocs).toBe(1)
      expect(body.docs.map((nyhet) => nyhet.id)).toEqual([publisert.id])
      expect(body.docs[0].content).toBe('Offentlig innhold.')
    },
  )

  it.each(['', '?draft=true'])(
    'skjuler et utkast ved direkte anonym HTTP-lesing%s',
    async (query) => {
      const utkast = await createNews('draft')
      const response = await requestNews(`/${utkast.id}${query}`)
      expect(response.status).toBe(404)
    },
  )

  it('skjuler en framtidig publiseringsdato frem til tidspunktet er nådd', async () => {
    const publiseringstid = '2026-11-05T11:00:00.000Z'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(publiseringstid))
    const nyhet = await createNews('published')
    expect(nyhet.publishedAt).toBe(publiseringstid)

    // Flytt lesetidspunktet bakover; hooken skal fortsatt eie den lagrede publiseringsdatoen.
    vi.setSystemTime(new Date('2026-11-05T10:00:00.000Z'))
    expect((await requestNews(`/${nyhet.id}`)).status).toBe(404)
    expect((await requestNews(`/${nyhet.id}?draft=true`)).status).toBe(404)
    const skjultListe = await requestNewsList([nyhet.id])
    expect(skjultListe.status).toBe(200)
    expect(await skjultListe.json()).toMatchObject({ docs: [], totalDocs: 0 })

    vi.setSystemTime(new Date(publiseringstid))
    const synligDetalj = await requestNews(`/${nyhet.id}`)
    expect(synligDetalj.status).toBe(200)
    expect(await synligDetalj.json()).toMatchObject({ id: nyhet.id, publishedAt: publiseringstid })
    const synligListe = await requestNewsList([nyhet.id])
    expect(await synligListe.json()).toMatchObject({ docs: [{ id: nyhet.id }], totalDocs: 1 })
  })

  it('lar en innlogget bruker lese utkast og framtidige nyheter med tilgangskontroll på', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-05T11:00:00.000Z'))
    const fremtidig = await createNews('published')
    const utkast = await createNews('draft')
    vi.setSystemTime(new Date('2026-11-05T10:00:00.000Z'))

    const result = await testPayload().find({
      collection: 'nyheter',
      where: { id: { in: [fremtidig.id, utkast.id] } },
      sort: 'id',
      depth: 0,
      user: editor,
      overrideAccess: false,
    })

    expect(result.totalDocs).toBe(2)
    expect(result.docs.map((nyhet) => nyhet.id)).toEqual([fremtidig.id, utkast.id])
    const lestUtkast = await testPayload().findByID({
      collection: 'nyheter',
      id: utkast.id,
      draft: true,
      user: editor,
      overrideAccess: false,
    })
    expect(lestUtkast._status).toBe('draft')
  })

  it('beholder offentlig innhold når en publisert nyhet får en nyere utkastversjon', async () => {
    const nyhet = await createNews('published', 'Opprinnelig offentlig innhold.')
    const utkast = await testPayload().update({
      collection: 'nyheter',
      id: nyhet.id,
      draft: true,
      overrideAccess: true,
      data: { content: 'Endringer som ikke er publisert.', _status: 'draft' },
    })
    expect(utkast._status).toBe('draft')

    const offentlig = await requestNews(`/${nyhet.id}`)
    expect(offentlig.status).toBe(200)
    expect(await offentlig.json()).toMatchObject({
      content: 'Opprinnelig offentlig innhold.',
      _status: 'published',
      publishedAt: nyhet.publishedAt,
    })

    const forhåndsvisning = await requestNews(`/${nyhet.id}?draft=true`)
    // Enten avvises utkastforespørselen, eller bare den publiserte versjonen returneres.
    expect([200, 404]).toContain(forhåndsvisning.status)
    if (forhåndsvisning.status === 200) {
      expect(await forhåndsvisning.json()).toMatchObject({
        content: 'Opprinnelig offentlig innhold.',
        _status: 'published',
      })
    }

    const redaktørversjon = await testPayload().findByID({
      collection: 'nyheter',
      id: nyhet.id,
      draft: true,
      user: editor,
      overrideAccess: false,
    })
    expect(redaktørversjon.content).toBe('Endringer som ikke er publisert.')
    expect(redaktørversjon._status).toBe('draft')
  })
})
