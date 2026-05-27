/** fetch() wrapped with an AbortController timeout.
 *  Default 20s — n8n cold starts can take ~12s, so we must NOT abort early.
 *  Throws an Error('timeout') if the limit is hit.
 */
export async function fetchWithTimeout(url, opts = {}, timeoutMs = 20000) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('timeout after ' + timeoutMs + 'ms')
    throw e
  } finally {
    clearTimeout(timer)
  }
}
