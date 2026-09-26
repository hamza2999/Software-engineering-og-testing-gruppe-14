import { Link, useParams } from 'react-router-dom'
import kurs from './kursData'
import './Kurs.css'

function Pamelding() {
  const { id } = useParams()
  const valgtKurs = kurs.find((course) => course.id === id)

  if (!valgtKurs) {
    return (
      <main className="registration-page">
        <h1>Kurset finnes ikke</h1>
        <Link to="/kurs">Tilbake til kurs</Link>
      </main>
    )
  }

  return (
    <main className="registration-page">
      <Link to="/kurs">Tilbake til kurs</Link>
      <h1>Påmelding</h1>
      <p>{valgtKurs.title}</p>

      <form className="registration-form">
        <label htmlFor="name">Navn</label>
        <input id="name" name="name" type="text" required />

        <label htmlFor="email">E-post</label>
        <input id="email" name="email" type="email" required />

        <label htmlFor="phone">Telefon</label>
        <input id="phone" name="phone" type="tel" />

        <button type="submit">Send påmelding</button>
      </form>
    </main>
  )
}

export default Pamelding