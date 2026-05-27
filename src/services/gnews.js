import { GNEWS_API_KEY } from '../config'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const CACHE_KEY = 'nexos_gnews_cache_v1'
const CACHE_MS  = 10 * 60 * 1000 // 10 minutes

// Categories → ticker tag. Kept small to respect the free-tier quota (1 req each).
const TOPICS = [
  { category: 'technology', tag: 'TECH' },
  { category: 'business',   tag: 'BIZ'  },
  { category: 'science',    tag: 'SCI'  },
]

/** Map one GNews article → the ticker item shape used by TickerBar/NewsModal. */
function mapArticle(a, tag) {
  return {
    h:    a.title || '',
    src:  a.source?.name || 'GNews',
    tag,
    desc: a.description || a.content || a.title || '',
    url:  a.url || null,
  }
}

/** Read cached ticker items if still fresh (< 10 min old). */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { ts, items } = JSON.parse(raw)
    if (!Array.isArray(items) || !items.length) return null
    if (Date.now() - ts > CACHE_MS) return null
    return items
  } catch { return null }
}

function writeCache(items) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items })) } catch { /* quota */ }
}

/** Fetch live headlines from GNews across a few categories.
 *  Uses a 10-minute localStorage cache to stay under the free quota.
 *  Returns ticker items, or null if GNews is unavailable (caller falls back to n8n).
 *  Pass force=true to bypass the cache (used by the 2-cycle ticker refresh).
 */
export async function fetchGNews(force = false) {
  if (!GNEWS_API_KEY) return null

  if (!force) {
    const cached = readCache()
    if (cached) { console.log('[GNews] cache hit'); return cached }
  }

  try {
    const results = await Promise.all(
      TOPICS.map(async ({ category, tag }) => {
        const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`
        const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } }, 20000)
        if (!res.ok) {
          // 429 = quota exhausted; 401/403 = bad key — surface but don't crash.
          console.warn('[GNews]', category, 'HTTP', res.status)
          return []
        }
        const data = await res.json()
        return (data.articles || []).map((a) => mapArticle(a, tag)).filter((it) => it.h)
      })
    )

    const items = results.flat().slice(0, 50)
    if (!items.length) return null
    writeCache(items)
    console.log('[GNews] fetched', items.length)
    return items
  } catch (e) {
    console.warn('[GNews]', e.message)
    return null
  }
}
