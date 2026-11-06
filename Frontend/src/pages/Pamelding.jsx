import { Navigate, useParams } from 'react-router-dom'

export default function Pamelding() {
  const { id } = useParams()
  return <Navigate to={`/kurs/${encodeURIComponent(id)}`} replace />
}
