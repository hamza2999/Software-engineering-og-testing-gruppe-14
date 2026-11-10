import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },

  // Payload håndterer passordhashing og genererer e-postlenke for glemt passord
  auth: {
    forgotPassword: {
      generateEmailHTML: (args: any) => {
        const token = args?.token
        const resetURL = `http://localhost:3000/tilbakestill-passord?token=${token}`
        return `
          <h1>Tilbakestill passord</h1>
          <p>Klikk på lenken under for å lage et nytt passord:</p>
          <a href="${resetURL}">Tilbakestill passord her</a>
        `
      },
    },
  },

  // Tilgangskontroll for hvem som kan gjøre hva
  access: {
    // Alle på nettsiden skal kunne opprette en konto (registrere seg)
    create: () => true,

    // Admin kan lese alle kontoer. Vanlige brukere ser kun sin egen
    read: ({ req }: any) => {
      const user = req?.user
      if (user?.rolle === 'admin') return true
      if (user) return { id: { equals: user.id } }
      return false
    },

    // Admin kan endre alle. Vanlige brukere kan bare endre sin egen konto
    update: ({ req }: any) => {
      const user = req?.user
      if (user?.rolle === 'admin') return true
      if (user) return { id: { equals: user.id } }
      return false
    },

    // Kun admin har lov til å slette brukere
    delete: ({ req }: any) => req?.user?.rolle === 'admin',
  },

  fields: [
    {
      name: 'rolle',
      type: 'select',
      required: true,
      // Standard rolle er deltaker slik at ingen får admin-rettigheter ved registrering
      defaultValue: 'deltaker',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Lokallagsansvarlig', value: 'lokallagsansvarlig' },
        { label: 'Deltaker', value: 'deltaker' },
      ],
    },
  ],
}