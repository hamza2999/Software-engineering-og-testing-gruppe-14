import { Link } from 'react-router-dom'
import nyheter from './nyheterData'
import './Nyheter.css'

function Nyheter() {
  return (
    <main className="news-page">
      <aside className="news-list">
        <h1>Nyheter</h1>
        <ul>
          {nyheter.map((nyhet) => (
            <li key={nyhet.id}>
              <Link to={`/nyheter/${nyhet.id}`}>{nyhet.title}</Link>
            </li>
          ))}
        </ul>
      </aside>

      <section className="news-main">
        <h2>Velg en nyhet</h2>
        <p>Her kan tekst og bilder til nyheten vises senere.</p>
      </section>
    </main>
  )
}

export default Nyheter;
