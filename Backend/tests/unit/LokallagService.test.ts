import { describe, expect, it, vi } from 'vitest'

import type { LokallagRepository } from '../../src/modules/lokallag/application/LokallagRepository'
import {
  InvalidLokallagQueryError,
  LokallagService,
} from '../../src/modules/lokallag/application/LokallagService'
import { LokallagDTO } from '../../src/modules/lokallag/http/LokallagDTO'

describe('LokallagService uten Payload eller database', () => {
  const createRepository = () => ({
    findPage: vi.fn<LokallagRepository['findPage']>().mockResolvedValue({
      items: [],
      totalItems: 45,
    }),
  })

  it('bruker standardverdier og beregner antall sider fra repository-resultatet', async () => {
    const repository = createRepository()
    const service = new LokallagService(repository)

    expect(await service.list()).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 45,
      totalPages: 3,
    })
    expect(repository.findPage).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
  })

  it('gir en gyldig tom oversikt når ingen lokallag finnes', async () => {
    const repository = createRepository()
    repository.findPage.mockResolvedValue({ items: [], totalItems: 0 })

    expect(await new LokallagService(repository).list()).toMatchObject({
      items: [],
      totalItems: 0,
      totalPages: 0,
    })
  })

  it.each([
    { page: 0 },
    { page: -1 },
    { page: 1.5 },
    { page: NaN },
    { page: Infinity },
    { page: Number.MAX_SAFE_INTEGER, pageSize: 100 },
    { pageSize: 0 },
    { pageSize: 101 },
    { pageSize: 1.5 },
    { pageSize: NaN },
  ])('avviser ugyldige argumenter før datatilgang: %j', async (query) => {
    const repository = createRepository()

    await expect(new LokallagService(repository).list(query)).rejects.toThrow(
      InvalidLokallagQueryError,
    )
    expect(repository.findPage).not.toHaveBeenCalled()
  })

  it.each([1, 100])('godtar grensene for sidestørrelse: %i', async (pageSize) => {
    const repository = createRepository()

    await new LokallagService(repository).list({ page: 2, pageSize })

    expect(repository.findPage).toHaveBeenCalledWith({ page: 2, pageSize })
  })

  it('lar feil fra datalagringen nå kalleren fremfor å vise en falsk tom oversikt', async () => {
    const repository = createRepository()
    repository.findPage.mockRejectedValue(new Error('Databasen er utilgjengelig'))

    await expect(new LokallagService(repository).list()).rejects.toThrow(
      'Databasen er utilgjengelig',
    )
  })
})

describe('LokallagDTO', () => {
  it('serialiserer bare avtalte oversiktsfelt, selv om modellen får flere felt', () => {
    const model = {
      id: '42',
      name: 'Testlaget',
      region: 'Østfold',
      description: 'Fiktive testdata',
      address: 'Testveien 1',
      contactEmail: 'test@example.com',
      contactPhone: null,
      internalNotes: 'Skal ikke følge med oversikten',
    }

    expect(JSON.parse(JSON.stringify(new LokallagDTO(model)))).toEqual({
      id: '42',
      name: 'Testlaget',
      region: 'Østfold',
      description: 'Fiktive testdata',
    })
  })
})
