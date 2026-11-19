import { useSearchParams } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { isKursPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'
import Pagination from '../components/Pagination'
import LokallagFilter from '../components/LokallagFilter'
import CourseCards from '../components/CourseCards'
import './Kurs.css'

export default function Kurs() {
  const [params, setParams] = useSearchParams()
  const lokallagId = params.get('lokallagId') ?? ''
  const courses = useApi(
    apiUrl('/kurs/oversikt', {
      page: params.get('page') ?? 1,
      pageSize: 6,
      lokallagId: lokallagId || undefined,
    }),
    isKursPage,
  )
  const changePage = (page) => {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
  }
  const changeGroup = (id) => setParams(id ? { lokallagId: id } : {})
  return (
    <main className="courses-page">
      <h1>Kurs</h1>
      <LokallagFilter value={lokallagId} onChange={changeGroup} />
      <ApiState resource={courses} loadingText="Laster kurs …" />
      {courses.data && (
        <>
          {courses.data.items.length === 0 && (
            <p className="empty-state">
              {courses.data.totalItems
                ? 'Ingen kurs på denne siden.'
                : 'Ingen kommende kurs å vise.'}
            </p>
          )}
          <section aria-label="Kommende kurs">
            <CourseCards items={courses.data.items} />
          </section>
          <Pagination {...courses.data} onChange={changePage} label="Sider med kurs" />
        </>
      )}
    </main>
  )
}
