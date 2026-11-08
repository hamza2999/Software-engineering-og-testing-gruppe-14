

import { Nyhet } from '../domain/Nyhet';
import { NyhetRepository } from '../domain/NyhetRepository';

export class NyhetService {
  private nyhetRepository: NyhetRepository;

  constructor(nyhetRepository: NyhetRepository) {
    this.nyhetRepository = nyhetRepository;
  }

  async hentAlleNyheter(): Promise<Nyhet[]> {
    return await this.nyhetRepository.finnAlle();
  }

  async hentNyhetMedId(id: string | number): Promise<Nyhet | null> {
    return await this.nyhetRepository.finnNyhetMedId(id);
  }

  async opprettNyhet(nyhetData: Partial<Nyhet>): Promise<Nyhet> {
    return await this.nyhetRepository.lagreNyhet(nyhetData);
  }
}