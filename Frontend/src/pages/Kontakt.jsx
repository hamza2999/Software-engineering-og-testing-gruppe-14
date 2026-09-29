import './Kontakt.css'

function Kontakt() {
  return (
    <main className="contact-page">
      <h1>Kontakt oss</h1>

      <p className="contact-intro">
        Har du spørsmål? Ta gjerne kontakt med oss.
      </p>

      <section className="contact-grid" aria-label="Kontaktinformasjon">
        <article className="contact-card">
          <h2>E-post</h2>
          <p>kontakt@husflidslaget.no</p>
          <a className="contact-button" href="mailto:kontakt@husflidslaget.no">
            Send e-post
          </a>
        </article>

        <article className="contact-card">
          <h2>Telefon</h2>
          <p>00 00 00 00</p>
          <a className="contact-button" href="tel:+4700000000">
            Ring oss
          </a>
        </article>

        <article className="contact-card">
          <h2>Adresse</h2>
          <p>Husflidsgata 1<br />0000 Oslo</p>
        </article>
      </section>

      <section className="contact-details">
        <h2>Åpningstider</h2>
        <p>Mandag til fredag, kl. 09:00-15:00</p>
      </section>
    </main>
  )
}

export default Kontakt;
