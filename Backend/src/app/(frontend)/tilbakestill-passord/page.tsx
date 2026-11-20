'use client'

import { useState, type FormEvent } from 'react'

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState('')

  async function reset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (!token) return setError('Åpne lenken i e-posten for å tilbakestille passordet.')
    if (data.get('password') !== data.get('confirmation')) {
      return setError('Passordene må være like.')
    }
    setError('')
    setStatus('saving')
    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.get('password'), token }),
      })
      if (!response.ok) throw new Error()
      form.reset()
      window.history.replaceState(null, '', window.location.pathname)
      setStatus('done')
    } catch {
      setStatus('idle')
      setError('Kunne ikke endre passordet. Prøv igjen eller be om en ny lenke.')
    }
  }

  return (
    <section lang="nb">
      <h1>Tilbakestill passord</h1>
      {status === 'done' ? (
        <p role="status">
          Passordet er endret. Du kan logge inn på nettsiden med det nye passordet.
        </p>
      ) : (
        <form onSubmit={reset}>
          <p>
            <label>
              Nytt passord{' '}
              <input name="password" type="password" autoComplete="new-password" required />
            </label>
          </p>
          <p>
            <label>
              Gjenta passord{' '}
              <input name="confirmation" type="password" autoComplete="new-password" required />
            </label>
          </p>
          <button type="submit" disabled={status === 'saving'}>
            Lagre passord
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </section>
  )
}
