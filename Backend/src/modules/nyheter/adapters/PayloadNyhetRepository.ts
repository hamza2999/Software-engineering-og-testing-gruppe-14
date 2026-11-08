import { Nyhet } from '../domain/Nyhet';
import { NyhetRepository } from '../domain/NyhetRepository';

export class PayloadNyhetRepository implements NyhetRepository {
  private payload: any;

  constructor(payload: any) {
    this.payload = payload;
  }

  async finnAlle(): Promise<Nyhet[]> {
    const result = await this.payload.find({
      collection: 'nyheter',
      depth: 1,
    });

    return result.docs.map((doc: any) => ({
      id: doc.id,
      tittel: doc.title,
      innhold: doc.content,
      publisertDato: doc.createdAt,
      bildeUrl: doc.bildeUrl?.url || doc.bildeUrl,
      visPaaForside: doc.visPaaForside,
      lokallagId: doc.lokallag,
    }));
  }

  async finnNyhetMedId(id: string | number): Promise<Nyhet | null> {
    try {
      const doc = await this.payload.findByID({
        collection: 'nyheter',
        id: String(id),
      });

      if (!doc) return null;

      return {
        id: doc.id,
        tittel: doc.title,
        innhold: doc.content,
        publisertDato: doc.createdAt,
        bildeUrl: doc.bildeUrl?.url || doc.bildeUrl,
        visPaaForside: doc.visPaaForside,
        lokallagId: doc.lokallag,
      };
    } catch {
      return null;
    }
  }

  async lagreNyhet(nyhetData: Partial<Nyhet>): Promise<Nyhet> {
    const doc = await this.payload.create({
      collection: 'nyheter',
      data: {
        title: nyhetData.tittel,
        content: nyhetData.innhold,
        lokallag: nyhetData.lokallagId,
      },
    });

    return {
      id: doc.id,
      tittel: doc.title,
      innhold: doc.content,
      publisertDato: doc.createdAt,
      bildeUrl: doc.bildeUrl?.url || doc.bildeUrl,
      visPaaForside: doc.visPaaForside,
      lokallagId: doc.lokallag,
    };
  }
}