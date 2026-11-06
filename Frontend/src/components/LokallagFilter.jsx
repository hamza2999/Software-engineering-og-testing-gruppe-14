import { apiUrl } from '../api/client'
import { isLokallagPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from './ApiState'

export default function LokallagFilter({ value, onChange }) {
  const groups = useApi(apiUrl('/lokallag/oversikt', { pageSize: 100 }), isLokallagPage, true)
  const items = groups.data ?? []
  return (
    <div className="resource-filter">
      <label htmlFor="lokallag-filter">Lokallag</label>
      <select
        id="lokallag-filter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={groups.loading}
      >
        <option value="">Alle lokallag</option>
        {value && !items.some((group) => group.id === value) && (
          <option value={value}>Valgt lokallag</option>
        )}
        {items.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
      <ApiState resource={groups} loadingText="Laster lokallag …" />
    </div>
  )
}
