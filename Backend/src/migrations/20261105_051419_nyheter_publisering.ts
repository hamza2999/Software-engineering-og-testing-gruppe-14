import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`_nyheter_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_published_at\` text,
  	\`version_content\` text,
  	\`version_lokallag_id\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`nyheter\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_lokallag_id\`) REFERENCES \`lokallag\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`_nyheter_v_parent_idx\` ON \`_nyheter_v\` (\`parent_id\`);`)
  await db.run(
    sql`CREATE INDEX \`_nyheter_v_version_version_lokallag_idx\` ON \`_nyheter_v\` (\`version_lokallag_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_nyheter_v_version_version_updated_at_idx\` ON \`_nyheter_v\` (\`version_updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_nyheter_v_version_version_created_at_idx\` ON \`_nyheter_v\` (\`version_created_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`_nyheter_v_version_version__status_idx\` ON \`_nyheter_v\` (\`version__status\`);`,
  )
  await db.run(sql`CREATE INDEX \`_nyheter_v_created_at_idx\` ON \`_nyheter_v\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`_nyheter_v_updated_at_idx\` ON \`_nyheter_v\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`_nyheter_v_latest_idx\` ON \`_nyheter_v\` (\`latest\`);`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_nyheter\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`published_at\` text,
  	\`content\` text,
  	\`lokallag_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`lokallag_id\`) REFERENCES \`lokallag\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`
  INSERT INTO "__new_nyheter"
    ("id", "title", "content", "lokallag_id", "updated_at", "created_at")
  SELECT
    "id", "title", "content", "lokallag_id", "updated_at", "created_at"
  FROM "nyheter";
`)
  await db.run(sql`DROP TABLE \`nyheter\`;`)
  await db.run(sql`ALTER TABLE \`__new_nyheter\` RENAME TO \`nyheter\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`nyheter_lokallag_idx\` ON \`nyheter\` (\`lokallag_id\`);`)
  await db.run(sql`CREATE INDEX \`nyheter_updated_at_idx\` ON \`nyheter\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`nyheter_created_at_idx\` ON \`nyheter\` (\`created_at\`);`)
  await db.run(sql`CREATE INDEX \`nyheter__status_idx\` ON \`nyheter\` (\`_status\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`_nyheter_v\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_nyheter\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`content\` text NOT NULL,
  	\`lokallag_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`lokallag_id\`) REFERENCES \`lokallag\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(
    sql`INSERT INTO \`__new_nyheter\`("id", "title", "content", "lokallag_id", "updated_at", "created_at") SELECT "id", "title", "content", "lokallag_id", "updated_at", "created_at" FROM \`nyheter\`;`,
  )
  await db.run(sql`DROP TABLE \`nyheter\`;`)
  await db.run(sql`ALTER TABLE \`__new_nyheter\` RENAME TO \`nyheter\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`nyheter_lokallag_idx\` ON \`nyheter\` (\`lokallag_id\`);`)
  await db.run(sql`CREATE INDEX \`nyheter_updated_at_idx\` ON \`nyheter\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`nyheter_created_at_idx\` ON \`nyheter\` (\`created_at\`);`)
}
