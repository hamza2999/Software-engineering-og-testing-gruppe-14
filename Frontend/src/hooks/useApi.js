import { useCallback, useEffect, useState } from 'react'
import { getAllPages, getJson } from '../api/client'

export function useApi(url, validate, allPages = false) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ key: null, status: 'idle', data: null, error: null })
  const key = JSON.stringify([url, allPages, attempt])
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (!url) return
    const controller = new AbortController()
    const load = allPages ? getAllPages : getJson
    load(url, validate, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, status: 'success', data, error: null })
      },
      (error) => {
        if (!controller.signal.aborted) setState({ key, status: 'error', data: null, error })
      },
    )
    return () => controller.abort()
  }, [url, validate, allPages, key])

  // Et nytt URL-valg skal ikke vise data fra forrige ressurs mens effekten starter.
  const current = !url
    ? { status: 'idle', data: null, error: null }
    : state.key === key
      ? state
      : { status: 'loading', data: null, error: null }
  return { ...current, loading: current.status === 'loading', retry }
}
