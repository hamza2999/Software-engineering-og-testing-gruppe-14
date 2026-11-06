import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { isLokallagPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'
import Pagination from '../components/Pagination'
import './Medlemsgrupper.css'

export default function Medlemsgrupper() {
  const groups = useApi(apiUrl('/lokallag/oversikt', { pageSize: 100 }), isLokallagPage, true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const filtered = (groups.data ?? []).filter((group) => {
    const text = search.trim().toLocaleLowerCase('nb-NO')
    return (
      group.name.toLocaleLowerCase('nb-NO').includes(text) ||
      group.region.toLocaleLowerCase('nb-NO').includes(text)
    )
  })
  const totalPages = Math.ceil(filtered.length / 12)
  const currentPage = Math.min(page, totalPages || 1)
  return (
    <main className="groups-page">
      <h1>Medlemsgrupper</h1>
      <label className="group-search-label" htmlFor="group-search">
        Søk etter medlemsgruppe
      </label>
      <input
        id="group-search"
        className="group-search"
        type="search"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder="Søk på navn eller region"
      />
      <ApiState resource={groups} loadingText="Laster medlemsgrupper …" />
      {groups.status === 'success' && (
        <>
          {filtered.length === 0 && <p className="empty-state">Ingen medlemsgrupper ble funnet.</p>}
          <section className="groups-grid" aria-label="Regionale medlemsgrupper">
            {filtered.slice((currentPage - 1) * 12, currentPage * 12).map((group) => (
              <article className="group-card" key={group.id}>
                <h2>{group.name}</h2>
                <p className="group-region">{group.region}</p>
                <p>{group.description}</p>
                <Link
                  className="group-button"
                  to={`/medlemsgrupper/${encodeURIComponent(group.id)}`}
                >
                  Se medlemsgruppe
                </Link>
              </article>
            ))}
          </section>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onChange={setPage}
            label="Sider med medlemsgrupper"
          />
        </>
      )}
    </main>
  )
}
