// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  createLocalReq,
  getAccessResults,
  getPayload,
  handleEndpoints,
  type Payload,
} from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { User } from '../../src/payload-types'

let payload: Payload
let directory: string
let member: User
let admin: User
let wizardStatus: number
let signupStatus: number
const key = 'konto-isolert-integrasjon'
const account = { email: 'deltaker@example.test', password: 'opprinnelig-testpassord' }

function request(url: string, data: Record<string, unknown>) {
  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: key,
    request: new Request(`http://localhost/api/${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  })
}

describe('Konto og tilgang mot en isolert SQLite-database', () => {
  beforeAll(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'husflid-konto-'))
    vi.stubEnv('DATABASE_URL', `file:${path.join(directory, 'test.db')}`)
    vi.stubEnv('PAYLOAD_SECRET', 'test-only-account-secret')
    vi.stubEnv('PAYLOAD_PUBLIC_SERVER_URL', 'https://backend.example.test')
    const { default: config } = await import('../../src/payload.config')
    payload = await getPayload({ config, key })
    wizardStatus = (await request('users/first-register', account)).status
    const registration = await request('users', account)
    signupStatus = registration.status
    member = (await registration.json()).doc
    admin = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: 'admin@example.test', password: 'separat-testpassord', rolle: 'admin' },
    })
  }, 30_000)
  afterAll(async () => {
    try {
      await payload?.destroy()
    } finally {
      if (directory) await rm(directory, { recursive: true, force: true })
      vi.unstubAllEnvs()
    }
  })

  it('skiller offentlig konto fra serveropprettet administrator også på tom database', async () => {
    expect(wizardStatus).toBe(403)
    expect(signupStatus).toBe(201)
    expect(member.rolle).toBe('deltaker')
    const user = member
    expect(user.id).not.toBe(admin.id)
    const ownRows = await payload.find({ collection: 'users', user, overrideAccess: false })
    expect(ownRows.docs.map((item) => item.id)).toEqual([user.id])
    const adminRows = await payload.find({
      collection: 'users',
      user: admin,
      overrideAccess: false,
    })
    expect(adminRows.totalDocs).toBe(2)
    const own = await payload.update({
      collection: 'users',
      id: user.id,
      user,
      overrideAccess: false,
      data: { email: user.email },
    })
    expect(own.rolle).toBe('deltaker')
    const req = await createLocalReq({ user: { ...user, collection: 'users' } }, payload)
    const permissions = await getAccessResults({ req })
    expect(permissions.canAccessAdmin).not.toBe(true)
    expect(permissions.collections?.users.fields).toMatchObject({ rolle: { read: true } })
    expect(permissions.collections?.users.fields).not.toHaveProperty('rolle.create')
    expect(permissions.collections?.users.fields).not.toHaveProperty('rolle.update')
    for (const collection of ['kurs', 'nyheter', 'lokallag', 'media']) {
      expect(permissions.collections?.[collection]).toBeDefined()
      for (const operation of ['create', 'update', 'delete']) {
        expect(permissions.collections?.[collection]).not.toHaveProperty(operation)
      }
    }
    expect(permissions.collections?.nyheter).not.toHaveProperty('readVersions')
  })
  it('lar bare administratorer tildele rolle og lage innhold', async () => {
    const staff = await payload.update({
      collection: 'users',
      id: member.id,
      user: admin,
      overrideAccess: false,
      data: { rolle: 'lokallagsansvarlig' },
    })
    expect(staff.rolle).toBe('lokallagsansvarlig')
    await payload.update({
      collection: 'users',
      id: member.id,
      user: admin,
      overrideAccess: false,
      data: { rolle: 'deltaker' },
    })
    const data = {
      name: 'Testlag',
      region: 'Nord',
      description: 'Fiktivt lag',
      address: 'Testgate 1',
    }
    await expect(
      payload.create({ collection: 'lokallag', user: member, overrideAccess: false, data }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.create({ collection: 'lokallag', user: admin, overrideAccess: false, data }),
    ).resolves.toMatchObject({ name: 'Testlag' })
  })

  it('gir samme konfigurasjonsfeil for kjent og ukjent adresse hvis offentlig URL mangler', async () => {
    const origin = process.env.PAYLOAD_PUBLIC_SERVER_URL
    vi.stubEnv('PAYLOAD_PUBLIC_SERVER_URL', '')
    try {
      for (const email of [account.email, 'finnes-ikke@example.test']) {
        const response = await request('users/forgot-password', { email })
        expect(response.status).toBe(503)
      }
    } finally {
      vi.stubEnv('PAYLOAD_PUBLIC_SERVER_URL', origin)
    }
  })

  it('sender passordlenke til konfigurert backend og godtar nytt passord én gang', async () => {
    const send = vi.spyOn(payload.email, 'sendEmail').mockResolvedValue(undefined)
    try {
      const response = await request('users/forgot-password', { email: account.email })
      expect(response.status).toBe(200)
      expect(send).toHaveBeenCalledTimes(1)
      const html = String(send.mock.calls[0][0].html)
      const link = new URL(/href="([^"]+)"/.exec(html)![1])
      expect(link.origin + link.pathname).toBe('https://backend.example.test/tilbakestill-passord')
      const token = new URLSearchParams(link.hash.slice(1)).get('token')
      expect(token).toBeTruthy()
      const password = 'nytt-lokalt-testpassord'
      const reset = await request('users/reset-password', { token, password })
      expect(reset.status).toBe(200)
      await expect(
        payload.login({ collection: 'users', data: { email: account.email, password } }),
      ).resolves.toHaveProperty('token')
      const used = await request('users/reset-password', { token, password })
      expect(used.ok).toBe(false)
    } finally {
      send.mockRestore()
    }
  })
})
