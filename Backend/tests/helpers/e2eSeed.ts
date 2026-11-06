import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'

const root = process.env.E2E_RUNTIME_DIR
if (
  !root ||
  path.dirname(root) !== tmpdir() ||
  !path.basename(root).startsWith('husflid-e2e-') ||
  process.env.DATABASE_URL !== `file:${path.join(root, 'test.db')}`
)
  throw new Error('E2E-seeding krever den isolerte testdatabasen fra globalSetup.')

const { default: config } = await import('../../src/payload.config')
const payload = await getPayload({ config, key: 'e2e-fixture-seed' })
try {
  const marker = randomUUID()
  const user = { email: 'nettlesertest@example.test', password: `Test-${randomUUID()}` }
  await payload.create({ collection: 'users', overrideAccess: true, data: user })

  const makeGroup = async (name: string, region = 'Østfold') => {
    const group = await payload.create({
      collection: 'lokallag',
      overrideAccess: true,
      data: {
        name,
        region,
        description: `Fiktivt lokallag fra testdatabasen. ${marker}`,
        address: 'Testveien 1',
        contactEmail: 'kontakt@example.test',
        contactPhone: '+47 000 00 000',
      },
    })
    return {
      id: String(group.id),
      name: group.name,
      address: group.address,
      contactEmail: group.contactEmail!,
      contactPhone: group.contactPhone!,
    }
  }
  const primary = await makeGroup('A Testlag Østfold')
  const secondary = await makeGroup('B Testlag Nord', 'Nordland')
  const empty = await makeGroup('C Tomt testlag', 'Oslo')
  for (let index = 1; index <= 98; index += 1)
    await makeGroup(`M Testlag ${String(index).padStart(3, '0')}`, 'Test')
  const last = await makeGroup('ZZZ Siste testlag')

  const news = []
  for (let index = 1; index <= 9; index += 1) {
    const nyhet = await payload.create({
      collection: 'nyheter',
      depth: 0,
      overrideAccess: true,
      data: {
        title: `Nyhet fra databasen ${index}`,
        content: `Dette innholdet kommer fra SQLite. Nyhet ${index}.`,
        lokallag: Number(index <= 7 ? primary.id : secondary.id),
        _status: 'published',
      },
    })
    if (!nyhet.publishedAt) throw new Error('Publisert testnyhet mangler dato')
    news.push({
      id: String(nyhet.id),
      title: nyhet.title,
      content: nyhet.content,
      lokallagId: String(nyhet.lokallag),
      publishedAt: nyhet.publishedAt,
    })
  }
  const latest = await payload.find({
    collection: 'nyheter',
    where: { _status: { equals: 'published' } },
    sort: ['-publishedAt', 'id'],
    limit: 1,
    overrideAccess: true,
  })
  const draft = await payload.create({
    collection: 'nyheter',
    draft: true,
    overrideAccess: true,
    data: {
      title: 'Skjult utkast fra databasen',
      content: 'Skal ikke vises offentlig.',
      lokallag: Number(primary.id),
      _status: 'draft',
    },
  })

  const courses = []
  const now = Date.now()
  for (let index = 1; index <= 9; index += 1) {
    const course = await payload.create({
      collection: 'kurs',
      depth: 0,
      overrideAccess: true,
      data: {
        title: `Kurs fra databasen ${index}`,
        date: new Date(now + (24 + index) * 3_600_000).toISOString(),
        description: `Et fiktivt kurs med data fra SQLite. Kurs ${index}.`,
        location: `Teststed ${index}`,
        price: index === 1 ? 0 : 15000,
        lokallag: Number(index <= 7 ? primary.id : secondary.id),
      },
    })
    courses.push({
      id: String(course.id),
      title: course.title,
      date: course.date,
      location: course.location!,
      price: course.price!,
      lokallagId: String(course.lokallag),
    })
  }
  const past = await payload.create({
    collection: 'kurs',
    overrideAccess: true,
    data: {
      title: 'Tidligere kurs fra databasen',
      date: new Date(now - 86_400_000).toISOString(),
      description: 'Et tidligere kurs.',
      location: 'Teststed',
      price: 10000,
      lokallag: Number(primary.id),
    },
  })

  await writeFile(
    path.join(root, 'manifest.json'),
    JSON.stringify({
      marker,
      user,
      groups: { primary, secondary, empty, last },
      news,
      latestNews: { id: String(latest.docs[0].id), title: latest.docs[0].title },
      draftNews: { id: String(draft.id), title: draft.title },
      courses,
      pastCourse: { id: String(past.id), title: past.title },
    }),
    { mode: 0o600 },
  )
  console.log('Isolerte E2E-testdata er opprettet.')
} finally {
  await payload.destroy()
}
