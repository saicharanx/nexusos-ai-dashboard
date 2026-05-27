import { N8N_WEBHOOK_URL } from '../config'
import { safeJsonParse, normalizeDashboard } from '../utils/json'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

/** Fetch and normalize the n8n dashboard payload. 20s timeout — n8n can be slow to wake. */
export async function fetchDashboard() {
  const res = await fetchWithTimeout(N8N_WEBHOOK_URL, { method: 'GET', headers: { Accept: 'application/json' } }, 20000)
  if (!res.ok) throw new Error('n8n HTTP ' + res.status)
  const text = await res.text()
  return normalizeDashboard(safeJsonParse(text))
}

/** Map n8n action_items array → task objects */
export function mapTasks(items) {
  if (!Array.isArray(items)) return []
  return items.map((it, i) => {
    const pr = (it.priority || '').toString().toUpperCase()
    return {
      id:        it.id || 'ai-' + Date.now() + '-' + i,
      name:      it.task || it.title || it.name || 'Untitled',
      priority:  pr === 'P1' ? 'HIGH' : pr === 'P3' ? 'LOW' : pr || 'MEDIUM',
      remind_at: it.remind_at || it.remindAt || null,
      done:      false,
    }
  })
}

/** Map n8n email_summary array → mail objects */
export function mapEmails(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((e, i) => ({
    id:        e.id || 'mail-' + i,
    from:      e.sender || e.from || 'Unknown',
    subject:   e.subject || '(No subject)',
    snippet:   e.snippet || e.preview || e.summary || '',
    body:      e.body || e.snippet || e.preview || '',
    time:      e.time || e.received_at || e.date || '',
    threadId:  e.threadId || null,
    messageId: e.messageId || e.id || null,
  }))
}

/** Merge all news arrays from n8n into a flat ticker list */
export function mapTicker(tech, ai, biz, hn, cve, arxiv, gh, ...extras) {
  const toItems = (arr, defaultTag) =>
    (Array.isArray(arr) ? arr : [])
      .map((it) => ({
        h:    it.title || it.headline || it.name || it.cve_id || '',
        src:  it.source || it.source_name || it.publisher || defaultTag,
        tag:  it.category || it.topic || defaultTag,
        desc: it.one_line_impact || it.summary || it.description || it.tagline || it.title || '',
        url:  it.url || it.link || null,
      }))
      .filter((it) => it.h)

  return [
    ...toItems(tech,  'TECH'),
    ...toItems(ai,    'AI'),
    ...toItems(biz,   'BIZ'),
    ...toItems(hn,    'HN'),
    ...toItems(cve,   'CVE'),
    ...toItems(arxiv, 'ARXIV'),
    ...toItems(gh,    'GITHUB'),
    ...(extras || []).flatMap((e) => toItems(e, 'NEWS')),
  ].slice(0, 50)
}
