/** Safely parse JSON with multiple fallback strategies */
export function safeJsonParse(value) {
  if (value == null) return null
  if (typeof value !== 'string') return value
  const clean = (s) => s.replace(/,(\s*[}\]])/g, '$1')
  const attempts = [
    () => JSON.parse(value),
    () => {
      const f = value.indexOf('{'), l = value.lastIndexOf('}')
      if (f !== -1 && l > f) return JSON.parse(value.slice(f, l + 1))
      throw 0
    },
    () => JSON.parse(clean(value)),
    () => {
      const f = value.indexOf('{'), l = value.lastIndexOf('}')
      if (f !== -1 && l > f) return JSON.parse(clean(value.slice(f, l + 1)))
      throw 0
    },
  ]
  for (const fn of attempts) { try { return fn() } catch { /* next */ } }
  return null
}

/** Normalize raw n8n dashboard response to { dashboard_data: {} } */
export function normalizeDashboard(raw) {
  if (!raw) return null
  let root = Array.isArray(raw) ? (raw[0]?.json || raw[0] || {}) : raw
  if (Array.isArray(root)) root = root[0]?.json || root[0] || {}
  let dd = root.dashboard_data ?? root.data ?? root.output ?? root.json ?? null
  if (dd == null && (root.weather || root.email_summary || root.tech_news_digest)) dd = root
  dd = safeJsonParse(dd) || dd
  if (!dd || typeof dd !== 'object') dd = {}
  return { generated_at: root.generated_at || null, dashboard_data: dd }
}
