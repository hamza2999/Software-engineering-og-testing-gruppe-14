import { Link } from 'react-router-dom'
import nyheter from './nyheterData'
import medlemsgrupper from './medlemsgrupperData'
import './Hjem.css'

function Hjem() {
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
            <h3>{nyheter[0].title}</h3>
            <p>Les mer om det som skjer hos Husflidslaget.</p>
            <Link to={`/nyheter/${nyheter[0].id}`}>Les nyheten</Link>
          </article>

          {medlemsgrupper.slice(0, 2).map((group) => (
            <article className="topic-card" key={group.id}>
              <p className="card-label">Medlemsgruppe</p>
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <Link to={`/medlemsgrupper/${group.id}`}>Se gruppen</Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-info-box">
        <p className="card-label">Informasjon</p>
        <h2>Informasjon kommer her</h2>
        <p>Denne boksen kan senere fylles med viktig informasjon og oppdateringer.</p>
      </section>
    </main>
  )
}

export default Hjem;
