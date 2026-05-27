import { parse12to24, hm24 } from './time'

/** Deterministic parser for explicit reminder COMMANDS — not a chatbot.
 *  Detects patterns like:
 *    "remind me to attend standup at 5 PM"
 *    "remind me to call John at 14:30"
 *    "reminder: submit report in 20 minutes"
 *    "remind me to stretch"            (no time → added without alarm)
 *  Returns { name, remind_at, priority } if it looks like a reminder, else null.
 *  When this returns null, the caller falls through to the Groq chatbot as normal.
 */
export function parseReminderCommand(text) {
  if (!text) return null
  const raw = text.trim()

  // Must start with an explicit reminder trigger — keeps normal chat going to Groq.
  const trigger = /^(?:remind me(?:\s+to)?|reminder[:\s]|set a reminder(?:\s+to)?|add (?:a )?(?:task|reminder)(?:\s+to)?)\s+/i
  if (!trigger.test(raw)) return null

  let body = raw.replace(trigger, '').trim()
  if (!body) return null

  // ── Extract time ──────────────────────────────────────────────────────────
  let remind_at = null

  // "in N minutes / mins / hours"
  const rel = body.match(/\bin\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?)\b/i)
  if (rel) {
    const n = parseInt(rel[1], 10)
    const unit = rel[2].toLowerCase()
    const d = new Date()
    if (unit.startsWith('h')) d.setHours(d.getHours() + n)
    else d.setMinutes(d.getMinutes() + n)
    remind_at = hm24(d)
    body = body.replace(rel[0], '').trim()
  }

  // "at 5 PM" / "at 5:30pm" / "at 14:30" / "at 9"
  if (!remind_at) {
    const at = body.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2})\b/i)
    if (at) {
      const parsed = parse12to24(at[1].trim()) || (/^\d{1,2}$/.test(at[1].trim()) ? hm24Pad(at[1].trim()) : null)
      if (parsed) { remind_at = parsed; body = body.replace(at[0], '').trim() }
    }
  }

  // Clean up trailing connector words left after stripping the time
  body = body.replace(/\b(at|by|around|on)\s*$/i, '').replace(/[,\s]+$/, '').trim()
  if (!body) return null

  // ── Priority from keywords ─────────────────────────────────────────────────
  let priority = 'MEDIUM'
  if (/\b(urgent|asap|critical|important|now|immediately)\b/i.test(raw)) priority = 'HIGH'
  else if (/\b(later|whenever|low priority|sometime|eventually)\b/i.test(raw)) priority = 'LOW'

  // Capitalize first letter of the task name for tidiness
  const name = body.charAt(0).toUpperCase() + body.slice(1)

  return { name, remind_at, priority }
}

/** "9" → "09:00" helper for bare-hour times like "at 9". */
function hm24Pad(hStr) {
  const h = parseInt(hStr, 10)
  if (isNaN(h) || h < 0 || h > 23) return null
  return String(h).padStart(2, '0') + ':00'
}
