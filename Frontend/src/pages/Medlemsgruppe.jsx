import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { isLokallagDetails, isNyhetPage, isKursPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'
import Pagination from '../components/Pagination'
import NewsLinks from '../components/NewsLinks'
import CourseCards from '../components/CourseCards'
import './Medlemsgrupper.css'

function GroupContent({ group }) {
  const [newsPage, setNewsPage] = useState(1)
  const [coursePage, setCoursePage] = useState(1)
  const news = useApi(
    apiUrl('/nyheter/oversikt', { lokallagId: group.id, page: newsPage, pageSize: 6 }),
    isNyhetPage,
  )
  const courses = useApi(
    apiUrl('/kurs/oversikt', { lokallagId: group.id, page: coursePage, pageSize: 6 }),
    isKursPage,
  )
  return (
    <>
      <h1>{group.name}</h1>
      <p className="group-region">{group.region}</p>
      <p className="group-description">{group.description}</p>
      <section className="group-contact" aria-label="Kontaktinformasjon">
        <p>{group.address}</p>
        {group.contactEmail && (
          <p>
            <a href={`mailto:${group.contactEmail}`}>{group.contactEmail}</a>
          </p>
        )}
        {group.contactPhone && (
          <p>
            <a href={`tel:${group.contactPhone.replace(/[^+0-9]/g, '')}`}>{group.contactPhone}</a>
          </p>
        )}
      </section>
      <section className="related-resources" aria-labelledby="group-news-heading">
        <h2 id="group-news-heading">Nyheter fra lokallaget</h2>
        <ApiState resource={news} loadingText="Laster nyheter …" />
        {news.data && (
          <>
            {news.data.items.length === 0 && (
              <p className="empty-state">Ingen publiserte nyheter å vise.</p>
            )}
            <NewsLinks
              items={news.data.items}
              search={`?lokallagId=${encodeURIComponent(group.id)}`}
            />
            <Pagination {...news.data} onChange={setNewsPage} label="Sider med lokale nyheter" />
          </>
        )}
      </section>
      <section className="related-resources" aria-labelledby="group-courses-heading">
        <h2 id="group-courses-heading">Kommende kurs i lokallaget</h2>
        <ApiState resource={courses} loadingText="Laster kurs …" />
        {courses.data && (
          <>
            {courses.data.items.length === 0 && (
              <p className="empty-state">Ingen kommende kurs å vise.</p>
            )}
            <CourseCards items={courses.data.items} compact />
            <Pagination {...courses.data} onChange={setCoursePage} label="Sider med lokale kurs" />
          </>
        )}
      </section>
    </>
  )
}

export default function Medlemsgruppe() {
  const { id } = useParams()
  const group = useApi(apiUrl(`/lokallag/detaljer/${encodeURIComponent(id)}`), isLokallagDetails)
  return (
    <main className="group-detail">
      <Link to="/medlemsgrupper">Tilbake til medlemsgrupper</Link>
      {group.error?.status === 404 ? (
        <h1>Medlemsgruppen finnes ikke</h1>
      ) : (
        <ApiState resource={group} loadingText="Laster medlemsgruppen …" />
      )}
      {group.data && <GroupContent key={group.data.id} group={group.data} />}
    </main>
  )
}
