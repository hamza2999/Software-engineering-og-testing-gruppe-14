import { getPayload } from 'payload'
import config from '../payload.config'

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim()
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
if (!email || !password || password.length < 12) {
  throw new Error('Oppgi BOOTSTRAP_ADMIN_EMAIL og BOOTSTRAP_ADMIN_PASSWORD (minst 12 tegn).')
}

const payload = await getPayload({ config })
try {
  // Oppretter kun en ny konto. Eksisterende identiteter skal aldri oppgraderes ut fra e-post alene.
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: { email, password, rolle: 'admin' },
  })
  console.log('Administratorkonto opprettet.')
} finally {
  await payload.destroy()
}
