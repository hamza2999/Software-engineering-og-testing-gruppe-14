import { APIError, type CollectionConfig } from 'payload'

import { adminOrSelf, isAdministrator } from '../access/accounts'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'email' },
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const configuredOrigin = process.env.PAYLOAD_PUBLIC_SERVER_URL
        if (!configuredOrigin || !args?.token) {
          throw new Error('Passordlenken krever PAYLOAD_PUBLIC_SERVER_URL og et gyldig token.')
        }
        const server = new URL(configuredOrigin)
        if (!['https:', 'http:'].includes(server.protocol)) {
          throw new Error('PAYLOAD_PUBLIC_SERVER_URL må være en HTTP(S)-adresse.')
        }
        const resetURL = new URL('/tilbakestill-passord', server.origin)
        // Fragmentet sendes ikke med i HTTP-adressen til webserveren.
        resetURL.hash = new URLSearchParams({ token: args.token }).toString()

        return `<h1>Tilbakestill passord</h1><p><a href="${resetURL.href}">Lag nytt passord</a></p>`
      },
    },
  },
  access: {
    admin: isAdministrator,
    create: () => true,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: isAdministrator,
    unlock: isAdministrator,
  },
  hooks: {
    beforeOperation: [
      ({ operation, overrideAccess, req }) => {
        // Payloads offentlige førstegangsveiviser bruker intern create med overrideAccess.
        // Første administrator opprettes eksplisitt via lokal CLI også på en ny database.
        if (
          operation === 'create' &&
          overrideAccess &&
          req.payloadAPI !== 'local' &&
          !isAdministrator({ req })
        ) {
          throw new APIError('Administrator må opprettes lokalt på serveren.', 403)
        }
      },
    ],
  },
  fields: [
    {
      name: 'rolle',
      type: 'select',
      required: true,
      defaultValue: 'deltaker',
      access: { create: isAdministrator, update: isAdministrator },
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Lokallagsansvarlig', value: 'lokallagsansvarlig' },
        { label: 'Deltaker', value: 'deltaker' },
      ],
    },
  ],
}
