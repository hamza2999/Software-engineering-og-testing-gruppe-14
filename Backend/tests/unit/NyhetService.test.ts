import { describe, expect, it, vi } from 'vitest'

import type { NyhetRepository } from '../../src/modules/nyheter/domain/NyhetRepository'
import { NyhetService } from '../../src/modules/nyheter/application/NyhetService'
import type { Nyhet } from '../../src/modules/nyheter/domain/Nyhet'

describe('NyhetService uten Payload eller database', () => {
  const createRepository = () => ({
    finnAlle: vi.fn<NyhetRepository['finnAlle']>().mockResolvedValue([
      { id: '1', tittel: 'Testnyhet 1', innhold: 'Innhold 1', publisertDato: '2026-11-08' }
    ]),
    finnNyhetMedId: vi.fn<NyhetRepository['finnNyhetMedId']>().mockImplementation(async (id) => {
      if (String(id) === '1') {
        return { id: '1', tittel: 'Testnyhet 1', innhold: 'Innhold 1', publisertDato: '2026-11-08' };
      }
      return null;
    }),
    lagreNyhet: vi.fn<NyhetRepository['lagreNyhet']>().mockImplementation(async (nyhetData: Partial<Nyhet>) => ({
      id: '2',
      tittel: nyhetData.tittel || '',
      innhold: nyhetData.innhold || '',
      publisertDato: nyhetData.publisertDato || '2026-11-08',
    })),
  })

  it('skal hente alle nyheter fra repositoryet', async () => {
    const repository = createRepository()
    const service = new NyhetService(repository)

    const nyheter = await service.hentAlleNyheter()
    expect(nyheter.length).toBe(1)
    expect(nyheter[0].tittel).toBe('Testnyhet 1')
    expect(repository.finnAlle).toHaveBeenCalledTimes(1)
  })

  it('skal hente en spesifikk nyhet med id', async () => {
    const repository = createRepository()
    const service = new NyhetService(repository)

    const nyhet = await service.hentNyhetMedId('1')
    expect(nyhet).not.toBeNull()
    expect(nyhet?.tittel).toBe('Testnyhet 1')
    expect(repository.finnNyhetMedId).toHaveBeenCalledWith('1')
  })

  it('skal kunne opprette en ny nyhet', async () => {
    const repository = createRepository()
    const service = new NyhetService(repository)

    const nyNyhet = await service.opprettNyhet({ tittel: 'Ny tittel', innhold: 'Nytt innhold' })
    expect(nyNyhet.tittel).toBe('Ny tittel')
    expect(repository.lagreNyhet).toHaveBeenCalledTimes(1)
  })
})