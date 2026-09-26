import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <section>
          <h2>Husflidslaget</h2>
          <p>Et fellesskap for håndverk, læring og gjenbruk.</p>
        </section>

        <section>
          <h2>Kontakt</h2>
          <address>
            <a href="mailto:kontakt@husflidslaget.no">kontakt@husflidslaget.no</a>
            <a href="tel:+4700000000">00 00 00 00</a>
          </address>
        </section>

        <section>
          <h2>Snarveier</h2>
          <Link to="/kontakt">Kontakt oss</Link>
          <Link to="/kurs">Se kurs</Link>
        </section>
      </div>
      <p className="footer-bottom">© 2026 Husflidslaget</p>
    </footer>
  )
}

export default Footer