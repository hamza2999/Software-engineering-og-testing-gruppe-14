import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const courses = await db.all<{ id: number; date: string }>(sql`SELECT id, date FROM kurs;`)
  const normalizedDates = courses.map((course) => {
    const timestamp = Date.parse(course.date)
    if (!Number.isFinite(timestamp)) {
      throw new Error(`Kurs ${course.id} har ugyldig dato. Rett datoen før migrering.`)
    }
    return { id: course.id, date: new Date(timestamp).toISOString() }
  })

  await db.run(sql`ALTER TABLE \`kurs\` ADD \`location\` text;`)
  await db.run(sql`ALTER TABLE \`kurs\` ADD \`price\` numeric;`)
  await db.run(sql`CREATE INDEX \`kurs_date_idx\` ON \`kurs\` (\`date\`);`)

  for (const course of normalizedDates) {
    await db.run(sql`UPDATE kurs SET date = ${course.date} WHERE id = ${course.id};`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`kurs_date_idx\`;`)
  await db.run(sql`ALTER TABLE \`kurs\` DROP COLUMN \`location\`;`)
  await db.run(sql`ALTER TABLE \`kurs\` DROP COLUMN \`price\`;`)
}
