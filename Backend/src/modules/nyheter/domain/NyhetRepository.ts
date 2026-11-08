
import { Nyhet } from './Nyhet';

export interface NyhetRepository {
  finnAlle(): Promise<Nyhet[]>;
  finnNyhetMedId(id: string | number): Promise<Nyhet | null>;
  lagreNyhet(nyhet: Partial<Nyhet>): Promise<Nyhet>;
}