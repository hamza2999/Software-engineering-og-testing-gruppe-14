// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { vi } from 'vitest'

// Integrasjonstestene setter hver sin DATABASE_URL før config importeres.
vi.stubEnv('NODE_ENV', 'test')
vi.stubEnv('PAYLOAD_DB_PUSH', 'true')
vi.stubEnv('PAYLOAD_MIGRATING', 'false')
