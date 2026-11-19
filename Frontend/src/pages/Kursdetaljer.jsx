import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { formatDateTime, formatPrice } from '../api/format'
import { isKurs } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'

export default function Kursdetaljer() {
  const { id } = useParams()
  const [openedAt] = useState(Date.now)
  const course = useApi(apiUrl(`/kurs/detaljer/${encodeURIComponent(id)}`), isKurs)
  return (
    <main className="course-details">
      <Link to="/kurs">Tilbake til kurs</Link>
      {course.error?.status === 404 ? (
        <h1>Kurset finnes ikke</h1>
      ) : (
        <ApiState resource={course} loadingText="Laster kurset …" />
      )}
      {course.data && (
        <>
          <h1>{course.data.title}</h1>
          {course.data.image && (
            <div className="course-image">
              <img src={course.data.image} alt="" />
            </div>
          )}
          <dl className="course-facts">
            <dt>Tidspunkt</dt>
            <dd>
              <time dateTime={course.data.date}>{formatDateTime(course.data.date)}</time>
            </dd>
            <dt>Sted</dt>
            <dd>{course.data.location}</dd>
            <dt>Pris</dt>
            <dd>{formatPrice(course.data.price)}</dd>
          </dl>
          <div className="course-detail-description">{course.data.description}</div>
          {Date.parse(course.data.date) < openedAt ? (
            <p>Dette kurset er avsluttet.</p>
          ) : (
            <p>Kontakt lokallaget for informasjon om kurset og påmelding.</p>
          )}
          <Link
            className="group-button"
            to={`/medlemsgrupper/${encodeURIComponent(course.data.lokallagId)}`}
          >
            Se lokallaget
          </Link>
        </>
      )}
    </main>
  )
}
