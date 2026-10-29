import { getPayload } from "payload";
import config from '../payload.config'
import { lokallagData,kursData, nyheterData } from "./data";

console.log('Lokallag:', lokallagData.length)
console.log('Kurs:', kursData.length)
console.log('Nyheter', nyheterData.length)

const payload = await getPayload({ config })

try {
    const result = await payload.count({
        collection: 'lokallag',
        overrideAccess: false,
    })
    console.log('Lokallag i databasen:', result.totalDocs)
} finally {
    await payload.destroy()
}


