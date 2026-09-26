import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import nyheter from '../pages/nyheterData'
import kurs from '../pages/kursData'
import medlemsgrupper from '../pages/medlemsgrupperData'
import './Header.css'

const pages = [
  { name: 'Hjem', path: '/' },
  { name: 'Kontakt', path: '/kontakt' },
  { name: 'Kurs', path: '/kurs' },
  { name: 'Medlemsgrupper', path: '/medlemsgrupper' },
  { name: 'Nyheter', path: '/nyheter' },
]

function Header() {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const handleSearch = (event) => {
    event.preventDefault()
    const searchText = search.trim().toLowerCase()

    if (!searchText) {
      setSearchResults([])
      return
    }

    const results = [
      ...nyheter.map((item) => ({
        id: `nyhet-${item.id}`,
        name: item.title,
        type: 'Nyhet',
        path: `/nyheter/${item.id}`,
        searchableText: item.title,
      })),
      ...kurs.map((item) => ({
        id: `kurs-${item.id}`,
        name: item.title,
        type: 'Kurs',
        path: `/kurs/${item.id}/pamelding`,
        searchableText: `${item.title} ${item.description}`,
      })),
      ...medlemsgrupper.map((item) => ({
        id: `gruppe-${item.id}`,
        name: item.name,
        type: 'Medlemsgruppe',
        path: `/medlemsgrupper/${item.id}`,
        searchableText: `${item.name} ${item.region} ${item.description}`,
      })),
    ].filter((item) => item.searchableText.toLowerCase().includes(searchText))

    setSearchResults(results)
  }

  return (
    <header className="site-header">
      <div className="header-content">
        <Link className="site-logo" to="/" aria-label="Husflidslaget, gå til hjem">
          <span className="logo-placeholder" aria-hidden="true">LOGO</span>
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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Søk"
            />
            <button type="submit">Søk</button>
          </div>
        </form>
      </div>

      {search && searchResults.length > 0 && (
        <ul className="search-results" aria-label="Søkeresultater">
          {searchResults.map((result) => (
            <li key={result.id}>
              <NavLink to={result.path} onClick={() => setSearchResults([])}>
                <span>{result.name}</span>
                <small>{result.type}</small>
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      {search && searchResults.length === 0 && (
        <p className="no-search-results">Ingen treff funnet.</p>
      )}
    </header>
  )
}

export default Header