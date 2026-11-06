import {
  ValidationError,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
  type Where,
} from 'payload'

import { completeKursFilters } from '../modules/kurs/adapters/kursReadFilters'
import {
  isValidKursLocation,
  isValidKursPrice,
  normalizeKursDate,
} from '../modules/kurs/domain/kursValidation'
import { kursDetailsEndpoint, kursOverviewEndpoint } from '../modules/kurs/http/kursEndpoints'
import type { Kur as KursDocument } from '../payload-types'

const validateCourseDetails: CollectionBeforeValidateHook<KursDocument> = async ({
  data,
  originalDoc,
  req,
}) => {
  const values = { ...originalDoc, ...data }
  const date = normalizeKursDate(values.date)
  const lagId: unknown = typeof values.lokallag === 'object' ? values.lokallag?.id : values.lokallag
  const numericLagId =
    typeof lagId === 'number' || (typeof lagId === 'string' && /^\d+$/.test(lagId))
      ? Number(lagId)
      : NaN
  const errors: { path: string; message: string }[] = []
  if (!date) {
    errors.push({ path: 'date', message: 'Dato må være et gyldig tidspunkt.' })
  }
  if (!isValidKursLocation(values.location)) {
    errors.push({ path: 'location', message: 'Sted må fylles ut.' })
  }
  if (!isValidKursPrice(values.price)) {
    errors.push({ path: 'price', message: 'Pris må være et sikkert heltall i øre, minst 0.' })
  }
  if (!Number.isSafeInteger(numericLagId) || numericLagId < 1) {
    errors.push({ path: 'lokallag', message: 'Et gyldig lokallag må velges.' })
  }
  if (errors.length) throw new ValidationError({ collection: 'kurs', errors, req })

  const lag = await req.payload.find({
    collection: 'lokallag',
    where: { id: { equals: numericLagId } },
    limit: 1,
    depth: 0,
    req,
    overrideAccess: false,
  })
  if (!lag.docs.length) {
    throw new ValidationError({
      collection: 'kurs',
      errors: [{ path: 'lokallag', message: 'Lokallaget finnes ikke.' }],
      req,
    })
  }
  // SQLite sammenligner datotekst. Felles UTC-format gjør datofilter og sortering entydig.
  return { ...data, date, location: values.location?.trim(), lokallag: numericLagId }
}

export const Kurs: CollectionConfig = {
  slug: 'kurs',

  endpoints: [kursOverviewEndpoint, kursDetailsEndpoint],

  admin: {
    useAsTitle: 'title',
  },

  access: {
    read: ({ req }): boolean | Where => (req.user ? true : { and: completeKursFilters() }),
  },

  hooks: { beforeValidate: [validateCourseDetails] },

  fields: [
    {
      name: 'title',
      label: 'Kursnavn',
      type: 'text',
      required: true,
    },
    {
      name: 'date',
      label: 'Kursdato',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'description',
      label: 'Beskrivelse',
      type: 'textarea',
      required: true,
    },
    // Nullable databasefelt bevarer gamle kurs uten å finne på sted eller pris.
    // Hooken krever gyldige verdier ved opprettelse og endring gjennom Payload.
    {
      name: 'location',
      label: 'Sted (påkrevd)',
      type: 'text',
      admin: { description: 'Oppgi sted og nødvendig adresseinformasjon.' },
    },
    {
      name: 'price',
      label: 'Pris i øre (påkrevd)',
      type: 'number',
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      admin: { step: 1, description: 'NOK: 15000 betyr 150 kroner. Angi 0 for gratis kurs.' },
    },
    {
      name: 'image',
      label: 'Bildelenke',
      type: 'text',
    },

    {
      name: 'lokallag',
      label: 'Lokallag (påkrevd)',
      type: 'relationship',
      relationTo: 'lokallag',
    },
  ],
}
