import { describe, expect, it, vi } from 'vitest'

import type { LokallagRepository } from '../../src/modules/lokallag/application/LokallagRepository'
import {
  InvalidLokallagIdError,
  InvalidLokallagQueryError,
  LokallagNotFoundError,
  LokallagService,
} from '../../src/modules/lokallag/application/LokallagService'
import type { Lokallag } from '../../src/modules/lokallag/domain/Lokallag'
import { LokallagDetailsDTO } from '../../src/modules/lokallag/http/LokallagDetailsDTO'
import { LokallagDTO } from '../../src/modules/lokallag/http/LokallagDTO'

const createRepository = () => ({
  findPage: vi.fn<LokallagRepository['findPage']>().mockResolvedValue({
    items: [],
    totalItems: 45,
  }),
  findById: vi.fn<LokallagRepository['findById']>().mockResolvedValue(null),
})

const lokallag: Lokallag = {
  id: '42',
  name: 'Testlaget',
  region: 'Østfold',
  description: 'Fiktive testdata',
  address: 'Testveien 1',
  contactEmail: 'test@example.com',
  contactPhone: '+47 12345678',
}

describe('LokallagService uten Payload eller database', () => {
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

describe('LokallagService: detaljer', () => {
  it.each(['1', String(Number.MAX_SAFE_INTEGER)])(
    'henter et lokallag med gyldig ID: %s',
    async (id) => {
      const repository = createRepository()
      const model = { ...lokallag, id }
      repository.findById.mockResolvedValue(model)

      expect(await new LokallagService(repository).getById(id)).toEqual(model)
      expect(repository.findById).toHaveBeenCalledWith(id)
    },
  )

  it('normaliserer ledende nuller før oppslag', async () => {
    const repository = createRepository()
    repository.findById.mockResolvedValue(lokallag)

    expect(await new LokallagService(repository).getById('00042')).toEqual(lokallag)
    expect(repository.findById).toHaveBeenCalledWith('42')
  })

  it.each([
    '',
    ' ',
    ' 1',
    '1 ',
    '1\n',
    '0',
    '-1',
    '1.5',
    'abc',
    'NaN',
    'Infinity',
    '1e2',
    '0x10',
    '+1',
    '9007199254740992',
  ])('avviser ugyldig ID før datatilgang: %j', async (id) => {
    const repository = createRepository()

    await expect(new LokallagService(repository).getById(id)).rejects.toThrow(
      InvalidLokallagIdError,
    )
    expect(repository.findById).not.toHaveBeenCalled()
  })

  it('skiller et manglende lokallag fra en ugyldig ID', async () => {
    const repository = createRepository()

    await expect(new LokallagService(repository).getById('42')).rejects.toThrow(
      LokallagNotFoundError,
    )
    expect(repository.findById).toHaveBeenCalledWith('42')
  })

  it('sender databasefeil videre fremfor å behandle dem som manglende lokallag', async () => {
    const repository = createRepository()
    const error = new Error('Databasen er utilgjengelig')
    repository.findById.mockRejectedValue(error)

    await expect(new LokallagService(repository).getById('42')).rejects.toBe(error)
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

describe('LokallagDetailsDTO', () => {
  it('serialiserer bare avtalte detaljfelt', () => {
    const model = { ...lokallag, internalNotes: 'Internt', createdAt: '2026-11-01T12:00:00Z' }

    expect(JSON.parse(JSON.stringify(new LokallagDetailsDTO(model)))).toEqual(lokallag)
  })

  it('beholder null for valgfrie kontaktfelt', () => {
    const model = { ...lokallag, contactEmail: null, contactPhone: null }

    expect(JSON.parse(JSON.stringify(new LokallagDetailsDTO(model)))).toEqual(model)
  })
})
