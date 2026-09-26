import { Link, useParams } from 'react-router-dom'
import nyheter from './nyheterData'
import './Nyheter.css'

function Nyhetsside() {
  const { id } = useParams()
  const nyhet = nyheter.find((item) => item.id === id)

  if (!nyhet) {
    return (
      <main className="news-page">
        <NewsList />
        <section className="news-article">
          <h1>Nyheten finnes ikke</h1>
        </section>
      </main>
    )
  }

  return (
    <main className="news-page">
      <NewsList />
      <section className="news-article">
        <h1>{nyhet.title}</h1>
        <section className="article-content">
          <p>Her kan innholdet til denne nyheten legges til senere.</p>
        </section>
      </section>
    </main>
  )
}

function NewsList() {
  return (
    <aside className="news-list">
      <h1>Nyheter</h1>
      <ul>
        {nyheter.map((item) => (
          <li key={item.id}>
            <Link to={`/nyheter/${item.id}`}>{item.title}</Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Nyhetsside