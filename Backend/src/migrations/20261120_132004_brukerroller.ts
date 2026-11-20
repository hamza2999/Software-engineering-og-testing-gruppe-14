import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`rolle\` text DEFAULT 'deltaker' NOT NULL;`)
  // På den gamle hovedgrenen var alle eksisterende Users-kontoer administratorer.
  await db.run(sql`UPDATE users SET rolle = 'admin';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  const otherRoles = await db.all(sql`SELECT id FROM users WHERE rolle <> 'admin' LIMIT 1;`)
  if (otherRoles.length) {
    throw new Error(
      'Tilbakerulling ville gitt deltakerkontoer administratorrettigheter. Behold rolleskjemaet eller gjenopprett sikkerhetskopien.',
    )
  }
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`rolle\`;`)
}
