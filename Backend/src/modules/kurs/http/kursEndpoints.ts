import { APIError, headersWithCors, type Endpoint, type PayloadRequest } from 'payload'

import { PayloadKursRepository } from '../adapters/PayloadKursRepository'
import {
  InvalidKursQueryError,
  KursLokallagNotFoundError,
  KursNotFoundError,
  KursService,
} from '../application/KursService'
import { KursDTO } from './KursDTO'

async function readResponse(
  req: PayloadRequest,
  read: (service: KursService) => Promise<unknown>,
): Promise<Response> {
  const headers = headersWithCors({ headers: new Headers(), req })
  try {
    const service = new KursService(new PayloadKursRepository(req))
    return Response.json(await read(service), { headers })
  } catch (error) {
    if (error instanceof InvalidKursQueryError) {
      return Response.json({ error: error.message }, { status: 400, headers })
    }
    if (error instanceof KursNotFoundError || error instanceof KursLokallagNotFoundError) {
      return Response.json({ error: error.message }, { status: 404, headers })
    }
    if (error instanceof APIError && error.status === 403) {
      return Response.json({ error: 'Ingen tilgang til å lese dataene.' }, { status: 403, headers })
    }
    req.payload.logger.error({ err: error }, 'Kunne ikke hente kurs')
    return Response.json(
      { error: 'Kunne ikke hente data. Prøv igjen senere.' },
      { status: 500, headers },
    )
  }
}

export const kursOverviewEndpoint: Endpoint = {
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
      return { ...result, items: result.items.map((kurs) => new KursDTO(kurs)) }
    }),
}

export const kursDetailsEndpoint: Endpoint = {
  path: '/detaljer/:id',
  method: 'get',
  handler: (req) =>
    readResponse(req, async (service) => {
      const id = req.routeParams?.id
      return new KursDTO(await service.getById(typeof id === 'string' ? id : ''))
    }),
}
