export default function ApiState({ resource, loadingText = 'Laster …' }) {
  if (resource.loading)
    return (
      <p className="api-state" role="status">
        {loadingText}
      </p>
    )
  if (!resource.error) return null
  return (
    <div className="api-state api-error" role="alert">
      <p>{resource.error.message || 'Kunne ikke hente data. Prøv igjen.'}</p>
      <button type="button" onClick={resource.retry}>
        Prøv igjen
      </button>
    </div>
  )
}
