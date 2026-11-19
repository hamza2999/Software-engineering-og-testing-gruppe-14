import { describe, expect, it, vi } from 'vitest'

import type { KursRepository } from '../../src/modules/kurs/application/KursRepository'
import {
  InvalidKursQueryError,
  KursLokallagNotFoundError,
  KursNotFoundError,
  KursService,
} from '../../src/modules/kurs/application/KursService'
import type { Kurs } from '../../src/modules/kurs/domain/Kurs'
import {
  isValidKursLocation,
  isValidKursPrice,
  normalizeKursDate,
} from '../../src/modules/kurs/domain/kursValidation'
import { KursDTO } from '../../src/modules/kurs/http/KursDTO'

const cutoff = '2026-11-06T12:00:00.000Z'
const now = () => new Date(cutoff)
const kurs: Kurs = {
  id: '42',
  title: 'Testkurs',
  date: '2026-11-07T12:00:00.000Z',
  description: 'Fiktivt kurs.',
  location: 'Testveien 1',
  price: 15000,
  currency: 'NOK',
  image: null,
  lokallagId: '7',
}

function createRepository() {
  return {
    findUpcomingPage: vi
      .fn<KursRepository['findUpcomingPage']>()
      .mockResolvedValue({ items: [], totalItems: 0 }),
    findById: vi.fn<KursRepository['findById']>().mockResolvedValue(kurs),
    lokallagExists: vi.fn<KursRepository['lokallagExists']>().mockResolvedValue(true),
  }
}

describe('KursService uten Payload eller database', () => {
  it('bruker standardverdier og gir en gyldig tom oversikt', async () => {
    const repository = createRepository()
    expect(await new KursService(repository, now).list()).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0,
    })
    expect(repository.findUpcomingPage).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      lokallagId: undefined,
      startsAtOrAfter: cutoff,
    })
    expect(repository.lokallagExists).not.toHaveBeenCalled()
  })

  it('normaliserer lokallags-ID og beregner sider fra filtrert total', async () => {
    const repository = createRepository()
    const items = [kurs, { ...kurs, id: '43' }]
    repository.findUpcomingPage.mockResolvedValue({ items, totalItems: 5 })
    expect(
      await new KursService(repository, now).list({ page: 2, pageSize: 2, lokallagId: '0007' }),
    ).toEqual({ items, page: 2, pageSize: 2, totalItems: 5, totalPages: 3 })
    expect(repository.lokallagExists).toHaveBeenCalledWith('7')
    expect(repository.findUpcomingPage).toHaveBeenCalledWith({
      page: 2,
      pageSize: 2,
      lokallagId: '7',
      startsAtOrAfter: cutoff,
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
      new KursService(repository, now).list({ ...query, lokallagId: '7' }),
    ).rejects.toBeInstanceOf(InvalidKursQueryError)
    expect(repository.lokallagExists).not.toHaveBeenCalled()
    expect(repository.findUpcomingPage).not.toHaveBeenCalled()
  })

  it.each([1, 100])('godtar sidestørrelse %i', async (pageSize) => {
    const repository = createRepository()
    await new KursService(repository, now).list({ pageSize })
    expect(repository.findUpcomingPage).toHaveBeenCalledWith(expect.objectContaining({ pageSize }))
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
  ])('avviser ugyldig detalj-ID og lokallagsfilter: %j', async (id) => {
    const repository = createRepository()
    const service = new KursService(repository, now)
    await expect(service.getById(id)).rejects.toThrow('id må være en positiv heltalls-ID.')
    await expect(service.list({ lokallagId: id })).rejects.toThrow(
      'lokallagId må være en positiv heltalls-ID.',
    )
    expect(repository.findById).not.toHaveBeenCalled()
    expect(repository.lokallagExists).not.toHaveBeenCalled()
    expect(repository.findUpcomingPage).not.toHaveBeenCalled()
  })

  it('skiller et ukjent lokallag fra et lag uten kommende kurs', async () => {
    const repository = createRepository()
    repository.lokallagExists.mockResolvedValue(false)
    await expect(new KursService(repository, now).list({ lokallagId: '7' })).rejects.toBeInstanceOf(
      KursLokallagNotFoundError,
    )
    expect(repository.findUpcomingPage).not.toHaveBeenCalled()
  })

  it('tillater detaljvisning av tidligere kurs og normaliserer ID', async () => {
    const repository = createRepository()
    const tidligere = { ...kurs, date: '2026-10-01T10:00:00.000Z' }
    repository.findById.mockResolvedValue(tidligere)
    const clock = vi.fn(now)
    expect(await new KursService(repository, clock).getById('00042')).toEqual(tidligere)
    expect(repository.findById).toHaveBeenCalledWith('42')
    expect(clock).not.toHaveBeenCalled()
  })

  it('gir mangler-feil når et lesbart kurs ikke finnes', async () => {
    const repository = createRepository()
    repository.findById.mockResolvedValue(null)
    await expect(new KursService(repository, now).getById('42')).rejects.toBeInstanceOf(
      KursNotFoundError,
    )
  })

  it('beregner tidsgrensen på nytt for hver listeforespørsel', async () => {
    const repository = createRepository()
    const senere = '2026-11-06T13:00:00.000Z'
    const clock = vi
      .fn()
      .mockReturnValueOnce(new Date(cutoff))
      .mockReturnValueOnce(new Date(senere))
    const service = new KursService(repository, clock)
    await service.list()
    await service.list()
    expect(repository.findUpcomingPage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ startsAtOrAfter: cutoff }),
    )
    expect(repository.findUpcomingPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ startsAtOrAfter: senere }),
    )
  })

  it('sender databasefeil videre fremfor å vise tom liste eller 404', async () => {
    const repository = createRepository()
    const error = new Error('Databasen er utilgjengelig')
    const service = new KursService(repository, now)
    repository.findUpcomingPage.mockRejectedValue(error)
    repository.findById.mockRejectedValue(error)
    repository.lokallagExists.mockRejectedValue(error)
    await expect(service.list()).rejects.toBe(error)
    await expect(service.list({ lokallagId: '7' })).rejects.toBe(error)
    await expect(service.getById('42')).rejects.toBe(error)
  })
})

describe('Kursformat og pris', () => {
  it('serialiserer avtalte felt, bevarer gratispris og skjuler interne felt', () => {
    const model = { ...kurs, price: 0, internalNotes: 'Internt' }
    expect(JSON.parse(JSON.stringify(new KursDTO(model)))).toEqual({ ...kurs, price: 0 })
  })

  it.each([0, 1, 15000, Number.MAX_SAFE_INTEGER])('godtar gyldig pris i øre: %s', (value) => {
    expect(isValidKursPrice(value)).toBe(true)
  })

  it.each([undefined, null, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '15000'])(
    'avviser manglende eller ugyldig pris: %s',
    (value) => {
      expect(isValidKursPrice(value)).toBe(false)
    },
  )

  it.each([undefined, null, '', '   '])('avviser manglende sted: %j', (value) => {
    expect(isValidKursLocation(value)).toBe(false)
  })

  it('godtar et utfylt sted', () => {
    expect(isValidKursLocation(' Testveien 1 ')).toBe(true)
  })

  it('normaliserer tidssoneforskjeller til samme UTC-tidspunkt', () => {
    expect(normalizeKursDate('2026-11-06T14:00:00+01:00')).toBe('2026-11-06T13:00:00.000Z')
    expect(normalizeKursDate('2026-11-06T13:00:00Z')).toBe('2026-11-06T13:00:00.000Z')
    expect(normalizeKursDate('2026-11-06T08:00:00-05:00')).toBe('2026-11-06T13:00:00.000Z')
  })

  it.each([undefined, null, '', 'ikke en dato'])('avviser ugyldig dato: %j', (value) => {
    expect(normalizeKursDate(value)).toBeNull()
  })
})
