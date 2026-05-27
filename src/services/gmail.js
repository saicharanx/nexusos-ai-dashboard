import { hm } from '../utils/time'

/** Base Gmail API fetch wrapper */
async function gmailFetch(token, path, opts = {}) {
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me' + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  })
  if (!r.ok) throw new Error('Gmail API ' + r.status)
  return r.json()
}

function getHeader(headers, name) {
  if (!Array.isArray(headers)) return ''
  return (headers.find((h) => h.name.toLowerCase() === name.toLowerCase()) || {}).value || ''
}

function gmailDecode(data) {
  if (!data) return ''
  try {
    const fixed  = data.replace(/-/g, '+').replace(/_/g, '/')
    const padded = fixed + '==='.slice(0, (4 - (fixed.length % 4)) % 4)
    return decodeURIComponent(
      Array.from(atob(padded)).map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    )
  } catch {
    try { return atob(data.replace(/-/g, '+').replace(/_/g, '/')) } catch { return '' }
  }
}

function stripHtml(s) {
  if (!s) return ''
  return s
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<li[^>]*>/gi, '• ').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    .trim().substring(0, 4000)
}

function extractMimePart(payload, preferMime) {
  if (!payload) return null
  if (payload.mimeType === preferMime && payload.body?.data) return gmailDecode(payload.body.data)
  if (Array.isArray(payload.parts)) {
    for (const p of payload.parts) if (p.mimeType === preferMime && p.body?.data) return gmailDecode(p.body.data)
    for (const p of payload.parts) { const f = extractMimePart(p, preferMime); if (f) return f }
  }
  return null
}

export function extractBody(payload) {
  if (!payload) return ''
  const plain = extractMimePart(payload, 'text/plain')
  if (plain && plain.trim().length > 20) return plain.trim().substring(0, 4000)
  const html = extractMimePart(payload, 'text/html')
  if (html) return stripHtml(html)
  return ''
}

/** Parse a full Gmail message object into a clean mail object */
export function parseGmailMessage(msg) {
  const headers     = msg.payload?.headers || []
  const fromRaw     = getHeader(headers, 'From')
  const subject     = getHeader(headers, 'Subject') || '(No Subject)'
  const dateRaw     = getHeader(headers, 'Date')
  const fromDisplay = fromRaw
    ? (fromRaw.replace(/<[^>]+>/g, '').replace(/"/g, '').trim() || fromRaw.split('@')[0] || 'Unknown')
    : 'Unknown'
  const dt   = dateRaw ? new Date(dateRaw) : null
  const now  = new Date()
  const time = dt
    ? (dt.toDateString() === now.toDateString() ? hm(dt) : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    : ''
  const body = extractBody(msg.payload)
  return { id: msg.id, threadId: msg.threadId, from: fromDisplay, fromFull: fromRaw, subject, date: time, time, body: body || msg.snippet || '', snippet: msg.snippet || '' }
}

/** Fetch up to 10 unread inbox messages (full format) */
export async function fetchGmailUnread(token) {
  const lst = await gmailFetch(token, '/messages?q=is:unread&maxResults=15&labelIds=INBOX')
  if (!lst.messages?.length) return []
  const msgs = await Promise.all(lst.messages.slice(0, 10).map((m) => gmailFetch(token, '/messages/' + m.id + '?format=full')))
  return msgs.map(parseGmailMessage)
}

/** Fetch full body for a single message */
export async function fetchGmailBody(token, msgId) {
  const msg = await gmailFetch(token, '/messages/' + msgId + '?format=full')
  return extractBody(msg.payload) || msg.snippet || ''
}

/** Send a Gmail reply */
export async function sendGmailReply(token, replyText, originalMail) {
  const toHeader     = originalMail.fromFull || originalMail.from
  const subjectClean = (originalMail.subject || '').replace(/^Re:\s*/i, '')
  const raw = [
    'To: ' + toHeader,
    'Subject: Re: ' + subjectClean,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    replyText,
  ].join('\r\n')
  const b64  = btoa(unescape(encodeURIComponent(raw))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const body = { raw: b64 }
  if (originalMail.threadId) body.threadId = originalMail.threadId
  return gmailFetch(token, '/messages/send', { method: 'POST', body: JSON.stringify(body) })
}
