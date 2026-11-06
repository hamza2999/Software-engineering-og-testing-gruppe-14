import { readFileSync } from 'node:fs'

export interface E2EManifest {
  marker: string
  user: { email: string; password: string }
  groups: {
    primary: {
      id: string
      name: string
      address: string
      contactEmail: string
      contactPhone: string
    }
    secondary: { id: string; name: string }
    empty: { id: string; name: string }
    last: { id: string; name: string }
  }
  news: { id: string; title: string; content: string; lokallagId: string; publishedAt: string }[]
  latestNews: { id: string; title: string }
  draftNews: { id: string; title: string }
  courses: {
    id: string
    title: string
    date: string
    location: string
    price: number
    lokallagId: string
  }[]
  pastCourse: { id: string; title: string }
}

export function fixtureData(): E2EManifest {
  if (!process.env.E2E_MANIFEST) throw new Error('E2E-oppsettet er ikke startet')
  return JSON.parse(readFileSync(process.env.E2E_MANIFEST, 'utf8'))
}

export function frontendURL(path = '/') {
  if (!process.env.E2E_FRONTEND_URL) throw new Error('E2E-frontend er ikke startet')
  return `${process.env.E2E_FRONTEND_URL}${path}`
}

export function backendURL(path = '/') {
  if (!process.env.E2E_BACKEND_URL) throw new Error('E2E-backend er ikke startet')
  return `${process.env.E2E_BACKEND_URL}${path}`
}
