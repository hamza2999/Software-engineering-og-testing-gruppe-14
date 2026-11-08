import { PayloadNyhetRepository } from '../adapters/PayloadNyhetRepository';
import { NyhetService } from '../application/NyhetService';
import { toNyhetDTO } from './NyhetDTO';

export async function nyhetEndpoints(req: any) {
  const repository = new PayloadNyhetRepository(req.payload);
  const service = new NyhetService(repository);

  return {
    getNyheter: async () => {
      const nyheter = await service.hentAlleNyheter();
      return nyheter.map(toNyhetDTO);
    },
    getNyhetById: async (id: string | number) => {
      const nyhet = await service.hentNyhetMedId(id);
      return nyhet ? toNyhetDTO(nyhet) : null;
    },
    createNyhet: async (data: any) => {
      const nyhet = await service.opprettNyhet(data);
      return toNyhetDTO(nyhet);
    },
  };
}