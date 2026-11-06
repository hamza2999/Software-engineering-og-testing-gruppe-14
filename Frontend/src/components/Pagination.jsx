export default function Pagination({ page, totalPages, onChange, label = 'Sider' }) {
  if (!totalPages) return null
  if (page > totalPages) {
    return (
      <button type="button" className="page-button" onClick={() => onChange(1)}>
        Gå til første side
      </button>
    )
  }
  if (totalPages === 1) return null
  return (
    <nav className="pagination" aria-label={label}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Forrige
      </button>
      <span aria-live="polite">
        Side {page} av {totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Neste
      </button>
    </nav>
  )
}
