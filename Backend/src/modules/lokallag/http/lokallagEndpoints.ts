import { headersWithCors, type Endpoint } from 'payload'

import { PayloadLokallagRepository } from '../adapters/PayloadLokallagRepository'
import { InvalidLokallagQueryError, LokallagService } from '../application/LokallagService'
import { LokallagDTO } from './LokallagDTO'

// Inngående adapter. Tilgjengelig som GET /api/lokallag/oversikt.
export const lokallagOverviewEndpoint: Endpoint = {
  path: '/oversikt',
  method: 'get',
  handler: async (req) => {
    const params = new URL(req.url!).searchParams
    const headers = headersWithCors({ headers: new Headers(), req })

    // Her kobles port og adapter sammen. Kjernen importerer ingen av adapterne.
    const repository = new PayloadLokallagRepository(req)
    const service = new LokallagService(repository)

    try {
      const result = await service.list({
        page: params.has('page') ? Number(params.get('page')) : undefined,
        pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : undefined,
      })

      return Response.json(
        { ...result, items: result.items.map((item) => new LokallagDTO(item)) },
        { headers },
      )
    } catch (error) {
      if (error instanceof InvalidLokallagQueryError) {
        return Response.json({ error: error.message }, { status: 400, headers })
      }
      throw error
    }
  },
}
