import { APIError, headersWithCors, type Endpoint, type PayloadRequest } from 'payload'

import { PayloadLokallagRepository } from '../adapters/PayloadLokallagRepository'
import {
  InvalidLokallagIdError,
  InvalidLokallagQueryError,
  LokallagNotFoundError,
  LokallagService,
} from '../application/LokallagService'
import { LokallagDTO } from './LokallagDTO'
import { LokallagDetailsDTO } from './LokallagDetailsDTO'

async function readResponse(
  req: PayloadRequest,
  read: (service: LokallagService) => Promise<unknown>,
): Promise<Response> {
  const headers = headersWithCors({ headers: new Headers(), req })
  try {
    return Response.json(await read(new LokallagService(new PayloadLokallagRepository(req))), {
      headers,
    })
  } catch (error) {
    if (error instanceof InvalidLokallagQueryError || error instanceof InvalidLokallagIdError) {
      return Response.json({ error: error.message }, { status: 400, headers })
    }
    if (error instanceof LokallagNotFoundError) {
      return Response.json({ error: error.message }, { status: 404, headers })
    }
    if (error instanceof APIError && error.status === 403) {
      return Response.json({ error: 'Ingen tilgang til å lese dataene.' }, { status: 403, headers })
    }
    req.payload.logger.error({ err: error }, 'Kunne ikke hente lokallag')
    return Response.json(
      { error: 'Kunne ikke hente data. Prøv igjen senere.' },
      { status: 500, headers },
    )
  }
}

// Inngående adapter. Tilgjengelig som GET /api/lokallag/oversikt.
export const lokallagOverviewEndpoint: Endpoint = {
  path: '/oversikt',
  method: 'get',
  handler: (req) =>
    readResponse(req, async (service) => {
      const params = new URL(req.url!).searchParams
      const result = await service.list({
        page: params.has('page') ? Number(params.get('page')) : undefined,
        pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : undefined,
      })

      return { ...result, items: result.items.map((item) => new LokallagDTO(item)) }
    }),
}

export const lokallagDetailsEndpoint: Endpoint = {
  path: '/detaljer/:id',
  method: 'get',
  handler: (req) =>
    readResponse(req, async (service) => {
      const id = req.routeParams?.id
      return new LokallagDetailsDTO(await service.getById(typeof id === 'string' ? id : ''))
    }),
}
