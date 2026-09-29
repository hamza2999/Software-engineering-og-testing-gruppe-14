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
import './App.css'


const communityLinks = [
  { label: 'GitHub', url: 'https://github.com/vitejs/vite', icon: 'github-icon' },
  { label: 'Discord', url: 'https://chat.vite.dev/', icon: 'discord-icon' },
  { label: 'X.com', url: 'https://x.com/vite_js', icon: 'x-icon' },
  { label: 'Bluesky', url: 'https://bsky.app/profile/vite.dev', icon: 'bluesky-icon' },
]

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