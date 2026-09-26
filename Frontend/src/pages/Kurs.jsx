import { Link } from 'react-router-dom'
import kurs from './kursData'
import './Kurs.css'

function Kurs() {
  return (
    <main className="courses-page">
      <h1>Kurs</h1>

      <section className="courses-grid" aria-label="Ledige kurs">
        {kurs.map((course) => (
          <article className="course-card" key={course.id}>
            <div className="course-image">
              {course.image ? <img src={course.image} alt="" /> : null}
            </div>
            <div className="course-card-content">
              <h2>{course.title}</h2>
              <p className="course-date">{course.date}</p>
              <p>{course.description}</p>
              <Link className="signup-button" to={`/kurs/${course.id}/pamelding`}>
                Meld deg på
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Kurs;
