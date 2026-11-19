import { Link } from 'react-router-dom'
import { formatDateTime } from '../api/format'

export default function NewsLinks({ items, search = '', activeId }) {
  return (
    <ul className="news-links">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            to={`/nyheter/${encodeURIComponent(item.id)}${search}`}
            aria-current={item.id === activeId ? 'page' : undefined}
          >
            <span>{item.title}</span>
            <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt)}</time>
          </Link>
        </li>
      ))}
    </ul>
  )
}
