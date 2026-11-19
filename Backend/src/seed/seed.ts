import { getPayload } from 'payload'
import config from '../payload.config'
import { lokallagData, kursData, nyheterData } from './data'

console.log('Lokallag:', lokallagData.length)
console.log('Kurs:', kursData.length)
console.log('Nyheter', nyheterData.length)

const payload = await getPayload({ config })

try {
  for (const lokallag of lokallagData) {
    const eksisterende = await payload.find({
      collection: 'lokallag',
      where: {
        name: {
          equals: lokallag.name,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (eksisterende.docs.length === 0) {
      await payload.create({
        collection: 'lokallag',
        data: lokallag,
        overrideAccess: true,
      })
    }
  }

  for (const kurs of kursData) {
    const lagResultat = await payload.find({
      collection: 'lokallag',
      where: {
        name: {
          equals: kurs.lokallagName,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    const lag = lagResultat.docs[0]

    if (!lag) {
      throw new Error(`Fant ikke lokallaget: ${kurs.lokallagName}`)
    }

    const eksisterendeKurs = await payload.find({
      collection: 'kurs',
      where: {
        and: [{ title: { equals: kurs.title } }, { lokallag: { equals: lag.id } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (eksisterendeKurs.docs.length === 0) {
      await payload.create({
        collection: 'kurs',
        data: {
          title: kurs.title,
          date: kurs.date,
          description: kurs.description,
          location: kurs.location,
          price: kurs.price,
          image: kurs.image ?? null,
          lokallag: lag.id,
        },
        overrideAccess: true,
      })
    }

    console.log(kurs.title, 'tilhører lokallag med ID:', lag.id)
  }

  for (const nyhet of nyheterData) {
    const lagResultat = await payload.find({
      collection: 'lokallag',
      where: {
        name: {
          equals: nyhet.lokallagName,
        },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const lag = lagResultat.docs[0]

    if (!lag) {
      throw new Error(`Fant ikke lokallaget: ${nyhet.lokallagName}`)
    }

    const eksisterendeNyhet = await payload.find({
      collection: 'nyheter',
      where: {
        and: [{ title: { equals: nyhet.title } }, { lokallag: { equals: lag.id } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (eksisterendeNyhet.docs.length === 0) {
      await payload.create({
        collection: 'nyheter',
        data: {
          title: nyhet.title,
          content: nyhet.content,
          lokallag: lag.id,
          _status: 'published',
        },
        overrideAccess: true,
      })
    }
  }

  const nyheterResultat = await payload.count({
    collection: 'nyheter',
    overrideAccess: false,
  })

  console.log('Publiserte nyheter i databasen:', nyheterResultat.totalDocs)

  const result = await payload.count({
    collection: 'lokallag',
    overrideAccess: false,
  })
  console.log('Lokallag i databasen:', result.totalDocs)
  const kursResultat = await payload.count({
    collection: 'kurs',
    overrideAccess: false,
  })

  console.log('Komplette kurs i databasen:', kursResultat.totalDocs)
} finally {
  await payload.destroy()
}
