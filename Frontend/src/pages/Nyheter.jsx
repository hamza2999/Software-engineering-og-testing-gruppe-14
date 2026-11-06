import { Link, useParams, useSearchParams } from 'react-router-dom'
import { apiUrl } from '../api/client'
import { formatDateTime } from '../api/format'
import { isNyhetDetails, isNyhetPage } from '../api/resources'
import { useApi } from '../hooks/useApi'
import ApiState from '../components/ApiState'
import Pagination from '../components/Pagination'
import LokallagFilter from '../components/LokallagFilter'
import NewsLinks from '../components/NewsLinks'
import './Nyheter.css'

export default function Nyheter() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const lokallagId = params.get('lokallagId') ?? ''
  const news = useApi(
    apiUrl('/nyheter/oversikt', {
      page: params.get('page') ?? 1,
      pageSize: 6,
      lokallagId: lokallagId || undefined,
    }),
    isNyhetPage,
  )
  const article = useApi(
    id ? apiUrl(`/nyheter/detaljer/${encodeURIComponent(id)}`) : null,
    isNyhetDetails,
  )
  const search = params.size ? `?${params}` : ''
  const changePage = (page) => {
    const next = new URLSearchParams(params)
    next.set('page', String(page))
    setParams(next)
  }
  return (
    <main className="news-page">
      <aside className="news-list" aria-label="Nyhetsoversikt">
        {id ? <h2>Nyheter</h2> : <h1>Nyheter</h1>}
        <LokallagFilter
          value={lokallagId}
          onChange={(value) => setParams(value ? { lokallagId: value } : {})}
        />
        <ApiState resource={news} loadingText="Laster nyheter …" />
        {news.data && (
          <>
            {news.data.items.length === 0 && (
              <p className="empty-state">
                {news.data.totalItems
                  ? 'Ingen nyheter på denne siden.'
                  : 'Ingen publiserte nyheter å vise.'}
              </p>
            )}
            <NewsLinks items={news.data.items} search={search} activeId={article.data?.id} />
            <Pagination {...news.data} onChange={changePage} label="Sider med nyheter" />
          </>
        )}
      </aside>
      <section className={id ? 'news-article' : 'news-main'} aria-label="Nyhetsinnhold">
        {!id ? (
          <>
            <h2>Aktuelt fra lokallagene</h2>
            <p>Nyheter vises i oversikten når de blir publisert.</p>
          </>
        ) : (
          <>
            <Link to={`/nyheter${search}`}>Tilbake til nyheter</Link>
            {article.error?.status === 404 ? (
              <h1>Nyheten finnes ikke</h1>
            ) : (
              <ApiState resource={article} loadingText="Laster nyheten …" />
            )}
            {article.data && (
              <>
                <h1>{article.data.title}</h1>
                <p>
                  <time dateTime={article.data.publishedAt}>
                    {formatDateTime(article.data.publishedAt)}
                  </time>
                </p>
                <p>
                  <Link to={`/medlemsgrupper/${encodeURIComponent(article.data.lokallagId)}`}>
                    Se lokallaget
                  </Link>
                </p>
                <div className="article-content">{article.data.content}</div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
