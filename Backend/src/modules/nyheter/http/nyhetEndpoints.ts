import { APIError, headersWithCors, type Endpoint, type PayloadRequest } from 'payload'

import { PayloadNyhetRepository } from '../adapters/PayloadNyhetRepository'
import {
  InvalidNyhetQueryError,
  NyhetLokallagNotFoundError,
  NyhetNotFoundError,
  NyhetService,
} from '../application/NyhetService'
import { NyhetDetailsDTO, NyhetDTO } from './NyhetDTO'

async function readResponse(
  req: PayloadRequest,
  read: (service: NyhetService) => Promise<unknown>,
): Promise<Response> {
  const headers = headersWithCors({ headers: new Headers(), req })

  try {
    const service = new NyhetService(new PayloadNyhetRepository(req))
    return Response.json(await read(service), { headers })
  } catch (error) {
    if (error instanceof InvalidNyhetQueryError) {
      return Response.json({ error: error.message }, { status: 400, headers })
    }
    if (error instanceof NyhetNotFoundError || error instanceof NyhetLokallagNotFoundError) {
      return Response.json({ error: error.message }, { status: 404, headers })
    }
    if (error instanceof APIError && error.status === 403) {
      return Response.json({ error: 'Ingen tilgang til å lese dataene.' }, { status: 403, headers })
    }

    req.payload.logger.error({ err: error }, 'Kunne ikke hente nyheter')
    return Response.json(
      { error: 'Kunne ikke hente data. Prøv igjen senere.' },
      { status: 500, headers },
    )
  }
}

export const nyhetOverviewEndpoint: Endpoint = {
  path: '/oversikt',
  method: 'get',
  handler: (req) =>
    readResponse(req, async (service) => {
      const params = new URL(req.url!).searchParams
      const result = await service.list({
        page: params.has('page') ? Number(params.get('page')) : undefined,
        pageSize: params.has('pageSize') ? Number(params.get('pageSize')) : undefined,
        lokallagId: params.has('lokallagId') ? params.get('lokallagId')! : undefined,
      })

      return { ...result, items: result.items.map((nyhet) => new NyhetDTO(nyhet)) }
    }),
}

export const nyhetDetailsEndpoint: Endpoint = {
  path: '/detaljer/:id',
  method: 'get',
  handler: (req) =>
    readResponse(req, async (service) => {
      const id = req.routeParams?.id
      const nyhet = await service.getById(typeof id === 'string' ? id : '')
      return new NyhetDetailsDTO(nyhet)
    }),
}
