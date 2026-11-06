import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cp, mkdtemp, readFile, rm, symlink } from 'node:fs/promises'
import { createServer, type AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface Server {
  child: ChildProcess
  output: () => string
}
const backendSource = fileURLToPath(new URL('../..', import.meta.url))
const frontendSource = path.resolve(backendSource, '../Frontend')
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function freePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const port = (server.address() as AddressInfo).port
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  return port
}

async function copyApp(source: string, target: string) {
  const excluded = new Set([
    'node_modules',
    '.next',
    'dist',
    '.git',
    '.agents',
    '.codex',
    '.aws',
    '.vscode',
    '.idea',
    '.npmrc',
    'media',
    'coverage',
    'playwright-report',
    'test-results',
    'blob-report',
  ])
  await cp(source, target, {
    recursive: true,
    filter: (file) => {
      const name = path.basename(file)
      return (
        !excluded.has(name) &&
        !name.startsWith('.env') &&
        !/\.db(?:-|$)/.test(name) &&
        !/\.(pem|key)$/.test(name)
      )
    },
  })
  await symlink(path.join(source, 'node_modules'), path.join(target, 'node_modules'), 'junction')
}

function start(args: string[], cwd: string, env: NodeJS.ProcessEnv): Server {
  const child = spawn(process.execPath, args, {
    cwd,
    env,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  const append = (chunk: Buffer) => {
    output = (output + chunk.toString()).slice(-20000)
  }
  child.stdout?.on('data', append)
  child.stderr?.on('data', append)
  child.on('error', (error) => {
    output += error.message
  })
  return { child, output: () => output }
}

async function stop(server: Server) {
  const { child } = server
  if (!child.pid) return
  const signal = (name: NodeJS.Signals) => {
    try {
      if (process.platform === 'win32') child.kill(name)
      else process.kill(-child.pid!, name)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
    }
  }
  signal('SIGTERM')
  for (
    let attempt = 0;
    attempt < 50 && child.exitCode === null && child.signalCode === null;
    attempt += 1
  )
    await delay(100)
  signal('SIGKILL')
}

async function run(args: string[], cwd: string, env: NodeJS.ProcessEnv, label: string) {
  const server = start(args, cwd, env)
  try {
    const code = await new Promise<number | null>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`${label} brukte for lang tid`)), 120_000)
      server.child.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
      server.child.once('exit', (code) => {
        clearTimeout(timeout)
        resolve(code)
      })
    })
    if (code !== 0) throw new Error(`${label} feilet (${code})`)
  } catch (error) {
    throw new Error(`${String(error)}\n${server.output()}`)
  } finally {
    await stop(server)
  }
}

async function waitFor(url: string, server: Server) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null || server.child.signalCode !== null) {
      throw new Error(`Testserveren stoppet før den var klar.\n${server.output()}`)
    }
    try {
      // La én førstegangskompilering fullføre. Korte avbrudd og nye forespørsler
      // kan bygge opp mange samtidige admin-renderinger på en travel maskin.
      const remaining = Math.max(1, deadline - Date.now())
      if ((await fetch(url, { signal: AbortSignal.timeout(remaining) })).ok) return
    } catch {
      /* Serveren kan fortsatt kompilere. */
    }
    await delay(250)
  }
  throw new Error(`Testserveren svarte ikke på ${url}\n${server.output()}`)
}

export default async function setup() {
  const root = await mkdtemp(path.join(tmpdir(), 'husflid-e2e-'))
  const servers: Server[] = []
  const cleanup = async () => {
    await Promise.all(servers.map(stop))
    await rm(root, { recursive: true, force: true })
  }
  try {
    const backend = path.join(root, 'Backend')
    const frontend = path.join(root, 'Frontend')
    await Promise.all([copyApp(backendSource, backend), copyApp(frontendSource, frontend)])
    const backendPort = await freePort()
    let frontendPort = await freePort()
    while (frontendPort === backendPort) frontendPort = await freePort()
    const backendURL = `http://127.0.0.1:${backendPort}`
    const frontendURL = `http://127.0.0.1:${frontendPort}`
    const env = {
      ...process.env,
      NODE_OPTIONS: '--no-deprecation',
      NEXT_TELEMETRY_DISABLED: '1',
      DATABASE_URL: `file:${path.join(root, 'test.db')}`,
      PAYLOAD_SECRET: `E2E-${randomUUID()}`,
      PAYLOAD_DB_PUSH: 'false',
      FRONTEND_URL: frontendURL,
      E2E_RUNTIME_DIR: root,
    }
    const payloadCLI = path.join(backend, 'node_modules/payload/bin.js')
    console.log('E2E: lager isolert database og testdata …')
    await run([payloadCLI, 'migrate'], backend, { ...env, NODE_ENV: 'production' }, 'Migrering')
    await run(
      [payloadCLI, 'run', 'tests/helpers/e2eSeed.ts'],
      backend,
      { ...env, NODE_ENV: 'production' },
      'E2E-seeding',
    )

    const frontEnv: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_OPTIONS: '--no-deprecation',
      NODE_ENV: 'production',
      API_PROXY_TARGET: backendURL,
      FRONTEND_CACHE_DIR: path.join(root, 'vite-cache'),
    }
    for (const key of Object.keys(frontEnv)) if (key.startsWith('VITE_')) delete frontEnv[key]
    delete frontEnv.DATABASE_URL
    delete frontEnv.PAYLOAD_SECRET
    frontEnv.VITE_API_BASE_URL = '/api'
    const viteCLI = path.join(frontend, 'node_modules/vite/bin/vite.js')
    console.log('E2E: bygger frontend …')
    await run([viteCLI, 'build'], frontend, frontEnv, 'Frontendbygg')

    console.log('E2E: starter egne backend- og frontendservere …')
    const back = start(
      [
        path.join(backend, 'node_modules/next/dist/bin/next'),
        'dev',
        '--webpack',
        '--hostname',
        '127.0.0.1',
        '--port',
        String(backendPort),
      ],
      backend,
      { ...env, NODE_ENV: 'development' },
    )
    servers.push(back)
    await waitFor(`${backendURL}/api/health`, back)
    // Next kompilerer admin ved første besøk. Gjør det før parallelle UI-tester,
    // så kompileringen ikke blokkerer de første API-kallene fra forsiden.
    await waitFor(`${backendURL}/admin/login`, back)
    const front = start(
      [viteCLI, 'preview', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'],
      frontend,
      frontEnv,
    )
    servers.push(front)
    await waitFor(frontendURL, front)

    const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'))
    // Kontroller at proxyen peker på nettopp denne testdatabasen, ikke en eksisterende server.
    const response = await fetch(
      `${frontendURL}/api/lokallag/detaljer/${manifest.groups.primary.id}`,
    )
    const group = await response.json()
    if (!response.ok || !group.description?.includes(manifest.marker))
      throw new Error('Proxyen peker ikke på den isolerte testdatabasen.')

    process.env.E2E_FRONTEND_URL = frontendURL
    process.env.E2E_BACKEND_URL = backendURL
    process.env.E2E_MANIFEST = path.join(root, 'manifest.json')
    console.log('E2E: testmiljøet er klart.')
    return cleanup
  } catch (error) {
    const logs = servers.map((server) => server.output()).join('\n')
    await cleanup()
    throw new Error(`${String(error)}\n${logs}`)
  }
}
