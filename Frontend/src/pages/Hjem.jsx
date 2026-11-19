import { Link } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { isLokallagPage, isNyhetPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'
import './Hjem.css'

export default function Hjem() {
  const news = useApi(apiUrl('/nyheter/oversikt', { pageSize: 1 }), isNyhetPage)
  const groups = useApi(apiUrl('/lokallag/oversikt', { pageSize: 2 }), isLokallagPage)
  const latest = news.data?.items[0]
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-content">
          <p className="hero-label">Husflidslaget</p>
          <h1>Skap, lær og hør til</h1>
          <p>Utforsk nyheter, kurs og lokale medlemsgrupper.</p>
        </div>
      </section>
      <section className="topics-section">
        <div className="section-heading">
          <p className="hero-label">Nytt hos oss</p>
          <h2>Aktuelle temaer</h2>
        </div>
        <div className="topics-grid">
          <article className="topic-card topic-card-featured">
            <p className="card-label">Siste nyhet</p>
            <ApiState resource={news} loadingText="Laster siste nyhet …" />
            {latest && (
              <>
                <h3>{latest.title}</h3>
                <p>Les mer om det som skjer hos Husflidslaget.</p>
                <Link to={`/nyheter/${encodeURIComponent(latest.id)}`}>Les nyheten</Link>
              </>
            )}
            {news.status === 'success' && !latest && <p>Det er ingen publiserte nyheter ennå.</p>}
          </article>
          <ApiState resource={groups} loadingText="Laster medlemsgrupper …" />
          {groups.data?.items.map((group) => (
            <article className="topic-card" key={group.id}>
              <p className="card-label">Medlemsgruppe</p>
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <Link to={`/medlemsgrupper/${encodeURIComponent(group.id)}`}>Se gruppen</Link>
            </article>
          ))}
          {groups.status === 'success' && groups.data.items.length === 0 && (
            <p>Ingen medlemsgrupper å vise.</p>
          )}
        </div>
      </section>
      <section className="home-info-box">
        <p className="card-label">Lokalt fellesskap</p>
        <h2>Finn ditt lokallag</h2>
        <p>Se lokale nyheter, kommende kurs og kontaktinformasjon.</p>
        <Link to="/medlemsgrupper">Se medlemsgruppene</Link>
      </section>
    </main>
  )
}
