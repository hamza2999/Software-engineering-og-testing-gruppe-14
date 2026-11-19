import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { healthResponse } from '../../health/healthEndpoint'

export const GET = async () => {
  const payload = await getPayload({
    config: configPromise,
  })

  return healthResponse(payload)
}
