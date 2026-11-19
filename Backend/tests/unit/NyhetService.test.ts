import { describe, expect, it, vi } from 'vitest'

import type { NyhetRepository } from '../../src/modules/nyheter/application/NyhetRepository'
import {
  InvalidNyhetQueryError,
  NyhetLokallagNotFoundError,
  NyhetNotFoundError,
  NyhetService,
} from '../../src/modules/nyheter/application/NyhetService'
import type { Nyhet } from '../../src/modules/nyheter/domain/Nyhet'
import { NyhetDetailsDTO, NyhetDTO } from '../../src/modules/nyheter/http/NyhetDTO'

const cutoff = '2026-11-06T12:00:00.000Z'
const now = () => new Date(cutoff)
const nyhet: Nyhet = {
  id: '42',
  title: 'Testnyhet',
  content: 'Fiktivt innhold.',
  lokallagId: '7',
  publishedAt: cutoff,
}

function createRepository() {
  return {
    findPublishedPage: vi.fn<NyhetRepository['findPublishedPage']>().mockResolvedValue({
      items: [],
      totalItems: 0,
    }),
    findPublishedById: vi.fn<NyhetRepository['findPublishedById']>().mockResolvedValue(nyhet),
    lokallagExists: vi.fn<NyhetRepository['lokallagExists']>().mockResolvedValue(true),
  }
}

describe('NyhetService uten Payload eller database', () => {
  it('bruker standardverdier og gir en gyldig tom oversikt', async () => {
    const repository = createRepository()
    expect(await new NyhetService(repository, now).list()).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    })
    expect(repository.findPublishedPage).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      lokallagId: undefined,
      publishedAtOrBefore: cutoff,
    })
    expect(repository.lokallagExists).not.toHaveBeenCalled()
  })

  it('normaliserer lokallags-ID, kontrollerer laget og beregner sider fra filtrert total', async () => {
    const repository = createRepository()
    const items = [nyhet, { ...nyhet, id: '43' }]
    repository.findPublishedPage.mockResolvedValue({ items, totalItems: 5 })
    expect(
      await new NyhetService(repository, now).list({ page: 2, pageSize: 2, lokallagId: '0007' }),
    ).toEqual({ items, page: 2, pageSize: 2, totalItems: 5, totalPages: 3 })
    expect(repository.lokallagExists).toHaveBeenCalledWith('7')
    expect(repository.findPublishedPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 2,
      lokallagId: '7',
      publishedAtOrBefore: cutoff,
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
  ])('avviser ugyldig paginering før datatilgang: %j', async (query) => {
    const repository = createRepository()
    await expect(
      new NyhetService(repository, now).list({ ...query, lokallagId: '7' }),
    ).rejects.toBeInstanceOf(InvalidNyhetQueryError)
    expect(repository.lokallagExists).not.toHaveBeenCalled()
    expect(repository.findPublishedPage).not.toHaveBeenCalled()
  })

  it.each([1, 100])('godtar sidestørrelse %i', async (pageSize) => {
    const repository = createRepository()
    await new NyhetService(repository, now).list({ pageSize })
    expect(repository.findPublishedPage).toHaveBeenCalledWith(expect.objectContaining({ pageSize }))
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
    '1e2',
    '0x10',
    '+1',
    '9007199254740992',
  ])('avviser ugyldig detalj-ID og lokallagsfilter før datatilgang: %j', async (id) => {
    const repository = createRepository()
    const service = new NyhetService(repository, now)
    await expect(service.getById(id)).rejects.toThrow('id må være en positiv heltalls-ID.')
    await expect(service.list({ lokallagId: id })).rejects.toThrow(
      'lokallagId må være en positiv heltalls-ID.',
    )
    expect(repository.findPublishedById).not.toHaveBeenCalled()
    expect(repository.lokallagExists).not.toHaveBeenCalled()
    expect(repository.findPublishedPage).not.toHaveBeenCalled()
  })

  it('skiller et ukjent lokallag fra en tom nyhetsliste', async () => {
    const repository = createRepository()
    repository.lokallagExists.mockResolvedValue(false)
    await expect(
      new NyhetService(repository, now).list({ lokallagId: '7' }),
    ).rejects.toBeInstanceOf(NyhetLokallagNotFoundError)
    expect(repository.findPublishedPage).not.toHaveBeenCalled()
  })

  it('henter detaljer med normalisert ID og grense for publiseringsdato', async () => {
    const repository = createRepository()
    expect(await new NyhetService(repository, now).getById('00042')).toEqual(nyhet)
    expect(repository.findPublishedById).toHaveBeenCalledWith('42', cutoff)
  })

  it('gir samme mangler-feil når repositoryet ikke finner en offentlig nyhet', async () => {
    const repository = createRepository()
    repository.findPublishedById.mockResolvedValue(null)
    await expect(new NyhetService(repository, now).getById('42')).rejects.toBeInstanceOf(
      NyhetNotFoundError,
    )
  })

  it('beregner nåtid på nytt for hvert oppslag', async () => {
    const repository = createRepository()
    const senere = '2026-11-06T13:00:00.000Z'
    const clock = vi
      .fn()
      .mockReturnValueOnce(new Date(cutoff))
      .mockReturnValueOnce(new Date(senere))
    const service = new NyhetService(repository, clock)
    await service.list()
    await service.getById('42')
    expect(repository.findPublishedPage).toHaveBeenCalledWith(
      expect.objectContaining({ publishedAtOrBefore: cutoff }),
    )
    expect(repository.findPublishedById).toHaveBeenCalledWith('42', senere)
    expect(clock).toHaveBeenCalledTimes(2)
  })

  it('sender datalagringsfeil videre og erstatter dem ikke med tomme svar eller 404', async () => {
    const repository = createRepository()
    const error = new Error('Databasen er utilgjengelig')
    const service = new NyhetService(repository, now)
    repository.findPublishedPage.mockRejectedValue(error)
    repository.findPublishedById.mockRejectedValue(error)
    repository.lokallagExists.mockRejectedValue(error)
    await expect(service.list()).rejects.toBe(error)
    await expect(service.list({ lokallagId: '7' })).rejects.toBe(error)
    await expect(service.getById('42')).rejects.toBe(error)
  })
})

describe('Nyhets-DTO-er', () => {
  it('viser oversiktsfelt og legger bare til innhold i detaljsvaret', () => {
    const model = { ...nyhet, internalNotes: 'Internt', _status: 'published' }
    const overview = JSON.parse(JSON.stringify(new NyhetDTO(model)))
    expect(overview).toEqual({ id: '42', title: 'Testnyhet', lokallagId: '7', publishedAt: cutoff })
    expect(JSON.parse(JSON.stringify(new NyhetDetailsDTO(model)))).toEqual(nyhet)
  })
})
