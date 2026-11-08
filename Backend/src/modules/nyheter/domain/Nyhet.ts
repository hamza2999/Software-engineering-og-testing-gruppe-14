
export interface Nyhet {
  id: string | number;
  tittel: string;
  innhold: string;
  publisertDato?: Date | string;
  bildeUrl?: string;
  visPaaForside?: boolean;
  lokallagId?: string | number;
}