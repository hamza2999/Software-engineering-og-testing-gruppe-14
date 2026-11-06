import { useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Hjem from './pages/Hjem'
import Nyheter from './pages/Nyheter'
import Nyhetsside from './pages/Nyhetsside'
import Kurs from './pages/Kurs'
import Kursdetaljer from './pages/Kursdetaljer'
import Pamelding from './pages/Pamelding'
import Kontakt from './pages/Kontakt'
import Medlemsgrupper from './pages/Medlemsgrupper'
import Medlemsgruppe from './pages/Medlemsgruppe'
import Login from './pages/Login'
import './App.css'
import './Api.css'

function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Hjem />} />
        <Route path="/nyheter" element={<Nyheter />} />
        <Route path="/nyheter/:id" element={<Nyhetsside />} />
        <Route path="/kurs" element={<Kurs />} />
        <Route path="/kurs/:id" element={<Kursdetaljer />} />
        <Route path="/kurs/:id/pamelding" element={<Pamelding />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/medlemsgrupper" element={<Medlemsgrupper />} />
        <Route path="/medlemsgrupper/:id" element={<Medlemsgruppe />} />
        <Route path="/logg-inn" element={<Login />} />
        <Route
          path="*"
          element={
            <main className="groups-page">
              <h1>Siden finnes ikke</h1>
              <Link to="/">Til forsiden</Link>
            </main>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
