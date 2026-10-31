import { getPayload } from "payload";
import config from '../payload.config'
import { lokallagData,kursData, nyheterData } from "./data";

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

    const result = await payload.count({
        collection: 'lokallag',
        overrideAccess: false,
    })
    console.log('Lokallag i databasen:', result.totalDocs)
} finally {
    await payload.destroy()
}


