import { Link, useParams } from 'react-router-dom'
import medlemsgrupper from './medlemsgrupperData'
import './Medlemsgrupper.css'

function Medlemsgruppe() {
  const { id } = useParams()
  const group = medlemsgrupper.find((item) => item.id === id)

  if (!group) {
    return (
      <main className="group-detail">
        <h1>Medlemsgruppen finnes ikke</h1>
        <Link to="/medlemsgrupper">Tilbake til medlemsgrupper</Link>
      </main>
    )
  }

  return (
    <main className="group-detail">
      <Link to="/medlemsgrupper">Tilbake til medlemsgrupper</Link>
      <h1>{group.name}</h1>
      <p>{group.description}</p>
      <section className="group-detail-content">
        <h2>Om gruppen</h2>
        <p>Her kan informasjon om den regionale medlemsgruppen legges til senere.</p>
      </section>
    </main>
  )
}

export default Medlemsgruppe