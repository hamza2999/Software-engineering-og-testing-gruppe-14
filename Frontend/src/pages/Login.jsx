import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  // Sjekker om brukeren allerede er logget inn
  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    setMessage(null)

    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Fyll inn både e-post og passord.' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!response.ok) {
        setMessage({ type: 'error', text: 'Feil e-post eller passord.' })
        return
      }

      const data = await response.json()
      setUser(data.user)
      setPassword('')
      setMessage({ type: 'success', text: 'Du er nå logget inn.' })
    } catch {
      setMessage({ type: 'error', text: 'Fikk ikke kontakt med serveren. Prøv igjen senere.' })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setMessage(null)

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Skriv inn e-posten din først, så sender vi en lenke.' })
      return
    }

    try {
      await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      setMessage({
        type: 'success',
        text: 'Hvis e-posten finnes hos oss, får du en lenke for å lage nytt passord.',
      })
    } catch {
      setMessage({ type: 'error', text: 'Fikk ikke kontakt med serveren. Prøv igjen senere.' })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    } finally {
      setUser(null)
      setMessage({ type: 'success', text: 'Du er nå logget ut.' })
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>{user ? 'Min side' : 'Logg inn'}</h1>

        {message && (
          <p className={`login-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
            {message.text}
          </p>
        )}

        {user ? (
          <div className="login-status">
            <p>
              Logget inn som <strong>{user.email}</strong>
            </p>
            <div className="login-actions">
              <Link className="login-button" to="/">
                Til forsiden
              </Link>
              <button type="button" className="login-button secondary" onClick={handleLogout}>
                Logg ut
              </button>
            </div>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <label htmlFor="login-email">E-post</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="login-password">Passord</label>
            <div className="password-field">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((current) => !current)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Skjul' : 'Vis'}
              </button>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logger inn …' : 'Logg inn'}
            </button>

            <button type="button" className="link-button" onClick={handleForgotPassword}>
              Glemt passord?
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default Login
