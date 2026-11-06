import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Kurs } from './collections/Kurs'
import { Nyheter } from './collections/Nyheter'
import { Lokallag } from './collections/Lokallag'
import { healthEndpoint } from './health/healthEndpoint'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin)

export default buildConfig({
  cors: frontendOrigins,
  csrf: frontendOrigins,
  endpoints: [healthEndpoint],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Kurs, Nyheter, Lokallag],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
