import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { isNyhetPage, isKursPage, isLokallagPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from './ApiState'
import './Header.css'

const pages = [
  { name: 'Hjem', path: '/' },
  { name: 'Kontakt', path: '/kontakt' },
  { name: 'Kurs', path: '/kurs' },
  { name: 'Medlemsgrupper', path: '/medlemsgrupper' },
  { name: 'Nyheter', path: '/nyheter' },
  { name: 'Logg inn', path: '/logg-inn' },
]

export default function Header() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const query = submitted?.key === location.key ? submitted.text : null
  const news = useApi(
    query ? apiUrl('/nyheter/oversikt', { pageSize: 100 }) : null,
    isNyhetPage,
    true,
  )
  const courses = useApi(
    query ? apiUrl('/kurs/oversikt', { pageSize: 100 }) : null,
    isKursPage,
    true,
  )
  const groups = useApi(
    query ? apiUrl('/lokallag/oversikt', { pageSize: 100 }) : null,
    isLokallagPage,
    true,
  )
  const retry = () => {
    news.retry()
    courses.retry()
    groups.retry()
  }
  const loading = news.loading || courses.loading || groups.loading
  const error = news.error || courses.error || groups.error
  const results = [
    ...(news.data ?? []).map((item) => ({
      key: `nyhet-${item.id}`,
      name: item.title,
      type: 'Nyhet',
      path: `/nyheter/${encodeURIComponent(item.id)}`,
      text: item.title,
    })),
    ...(courses.data ?? []).map((item) => ({
      key: `kurs-${item.id}`,
      name: item.title,
      type: 'Kurs',
      path: `/kurs/${encodeURIComponent(item.id)}`,
      text: `${item.title} ${item.description}`,
    })),
    ...(groups.data ?? []).map((item) => ({
      key: `lag-${item.id}`,
      name: item.name,
      type: 'Medlemsgruppe',
      path: `/medlemsgrupper/${encodeURIComponent(item.id)}`,
      text: `${item.name} ${item.region} ${item.description}`,
    })),
  ].filter((item) => query && item.text.toLocaleLowerCase('nb-NO').includes(query))

  const handleSearch = (event) => {
    event.preventDefault()
    const text = search.trim().toLocaleLowerCase('nb-NO')
    setSubmitted(text ? { text, key: location.key } : null)
    if (text) retry()
  }

  return (
    <header className="site-header">
      <div className="header-content">
        <Link className="site-logo" to="/" aria-label="Husflidslaget, gå til hjem">
          <span className="logo-placeholder" aria-hidden="true">
            LOGO
          </span>
        </Link>
        <nav aria-label="Hovedmeny">
          <ul className="navigation-list">
            {pages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  end={page.path === '/'}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {page.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <form className="site-search" onSubmit={handleSearch} role="search">
          <label htmlFor="site-search-input">Søk på nettsiden</label>
          <div className="search-controls">
            <input
              id="site-search-input"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setSubmitted(null)
              }}
              placeholder="Søk"
            />
            <button type="submit">Søk</button>
          </div>
        </form>
      </div>
      {query && (
        <>
          <ApiState resource={{ loading, error, retry }} loadingText="Søker …" />
          {!loading && !error && (
            <>
              <p className="no-search-results" role="status">
                {results.length ? `${results.length} treff funnet.` : 'Ingen treff funnet.'}
              </p>
              <ul className="search-results" aria-label="Søkeresultater">
                {results.map((result) => (
                  <li key={result.key}>
                    <Link to={result.path} onClick={() => setSubmitted(null)}>
                      <span>{result.name}</span>
                      <small>{result.type}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </header>
  )
}
