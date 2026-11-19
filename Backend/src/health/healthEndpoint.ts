import { headersWithCors, type Endpoint, type Payload } from 'payload'

export async function healthResponse(payload: Payload, headers = new Headers()): Promise<Response> {
  headers.set('Cache-Control', 'no-store')
  try {
    // Intern tilgjengelighetskontroll. Ingen telling eller brukerdata returneres til klienten.
    await payload.count({ collection: 'lokallag', overrideAccess: true })
    return Response.json({ status: 'ok' }, { headers })
  } catch (error) {
    payload.logger.error({ err: error }, 'Healthcheck kunne ikke lese databasen')
    return Response.json({ status: 'unavailable' }, { status: 503, headers })
  }
}

export const healthEndpoint: Endpoint = {
  path: '/health',
  method: 'get',
  handler: (req) => healthResponse(req.payload, headersWithCors({ headers: new Headers(), req })),
}
