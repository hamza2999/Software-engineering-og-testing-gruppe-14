export interface NyhetDTO {
  id: string | number;
  tittel: string;
  innhold: string;
  publisertDato?: string;
  bildeUrl?: string;
  visPaaForside?: boolean;
}

export function toNyhetDTO(nyhet: any): NyhetDTO {
  return {
    id: nyhet.id,
    tittel: nyhet.tittel,
    innhold: nyhet.innhold,
    publisertDato: nyhet.publisertDato ? new Date(nyhet.publisertDato).toISOString() : undefined,
    bildeUrl: nyhet.bildeUrl,
    visPaaForside: nyhet.visPaaForside,
  };
}