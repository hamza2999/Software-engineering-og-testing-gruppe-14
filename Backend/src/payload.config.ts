import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Kurs } from './collections/Kurs'
import { Nyheter } from './collections/Nyheter'
import { Lokallag } from './collections/Lokallag'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Kurs, Nyheter, Lokallag],
  editor: lexicalEditor(),
  email: nodemailerAdapter({
    defaultFromAddress: 'utvikling@lokallag.no',
    defaultFromName: 'Lokallag Test',
    transportOptions: {
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'jayson.mcclure@ethereal.email',
        pass: 'gK9Hv1fSygEJ28gw7y'
      }
    },
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})