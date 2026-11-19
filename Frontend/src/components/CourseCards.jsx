import { Link } from 'react-router-dom'
import { formatDateTime, formatPrice } from '../api/format'
import '../pages/Kurs.css'

export default function CourseCards({ items, compact = false }) {
  const Heading = compact ? 'h3' : 'h2'
  return (
    <div className="courses-grid">
      {items.map((course) => (
        <article className="course-card" key={course.id}>
          {course.image && (
            <div className="course-image">
              <img src={course.image} alt="" loading="lazy" />
            </div>
          )}
          <div className="course-card-content">
            <Heading>{course.title}</Heading>
            <p className="course-date">
              <time dateTime={course.date}>{formatDateTime(course.date)}</time>
            </p>
            <p className="course-location">Sted: {course.location}</p>
            <p className="course-price">Pris: {formatPrice(course.price)}</p>
            <p className="course-description">{course.description}</p>
            <Link className="signup-button" to={`/kurs/${encodeURIComponent(course.id)}`}>
              Se kurset
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
