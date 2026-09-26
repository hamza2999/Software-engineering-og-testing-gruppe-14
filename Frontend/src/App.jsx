import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Hjem from './pages/Hjem'
import Nyheter from './pages/Nyheter'
import Nyhetsside from './pages/Nyhetsside'
import Kurs from './pages/Kurs'
import Pamelding from './pages/Pamelding'
import Kontakt from './pages/Kontakt'
import Medlemsgrupper from './pages/Medlemsgrupper'
import Medlemsgruppe from './pages/Medlemsgruppe'


function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Hjem />} />
        <Route path="/nyheter" element={<Nyheter />} />
        <Route path="/nyheter/:id" element={<Nyhetsside />} />
        <Route path="/kurs" element={<Kurs />} />
        <Route path="/kurs/:id/pamelding" element={<Pamelding />} />
        <Route path="/kontakt" element={<Kontakt />} />
        <Route path="/medlemsgrupper" element={<Medlemsgrupper />} />
        <Route path="/medlemsgrupper/:id" element={<Medlemsgruppe />} />
        <Route path="*" element={<Hjem />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App