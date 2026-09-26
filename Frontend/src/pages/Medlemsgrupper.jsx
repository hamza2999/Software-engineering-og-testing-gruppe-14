import { useState } from 'react'
import { Link } from 'react-router-dom'
import medlemsgrupper from './medlemsgrupperData'
import './Medlemsgrupper.css'

function Medlemsgrupper() {
  const [search, setSearch] = useState('')
  const filteredGroups = medlemsgrupper.filter((group) => {
    const searchText = search.toLowerCase()
    return (
      group.name.toLowerCase().includes(searchText) ||
      group.region.toLowerCase().includes(searchText)
    )
  })

  return (
    <main className="groups-page">
      <h1>Medlemsgrupper</h1>
      <label className="group-search-label" htmlFor="group-search">
        Søk etter medlemsgruppe
      </label>
      <input
        className="group-search"
        id="group-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Søk på navn eller region"
      />

      <section className="groups-grid" aria-label="Regionale medlemsgrupper">
        {filteredGroups.map((group) => (
          <article className="group-card" key={group.id}>
            <h2>{group.name}</h2>
            <p className="group-region">{group.region}</p>
            <p>{group.description}</p>
            <Link className="group-button" to={`/medlemsgrupper/${group.id}`}>
              Se medlemsgruppe
            </Link>
          </article>
        ))}
      </section>

      {filteredGroups.length === 0 && <p>Ingen medlemsgrupper ble funnet.</p>}
    </main>
  )
}

export default Medlemsgrupper;
