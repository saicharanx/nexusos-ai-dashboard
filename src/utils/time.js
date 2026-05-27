/** Format a Date as 12-hour "H:MM AM/PM" */
export function hm(d) {
  const h = d.getHours(), m = d.getMinutes()
  const ap = h >= 12 ? 'PM' : 'AM'
  return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + ap
}

/** Format stored "HH:MM" string as 12-hour */
export function fmt12hm(hmStr) {
  if (!hmStr) return ''
  try {
    const [hStr, mStr] = hmStr.split(':')
    const h = parseInt(hStr), m = parseInt(mStr || 0)
    const ap = h >= 12 ? 'PM' : 'AM'
    return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + ap
  } catch { return hmStr }
}

/** Current time as "HH:MM" 24-hour */
export function hm24(d) {
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

/** Parse "6pm" / "6:30 AM" / "18:00" → "HH:MM" */
export function parse12to24(str) {
  if (!str) return null
  str = str.trim()
  if (/^\d{1,2}:\d{2}$/.test(str)) return str.length === 4 ? '0' + str : str
  const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i)
  if (!m) return null
  let h = parseInt(m[1]), min = parseInt(m[2] || '0')
  const ap = (m[3] || '').toLowerCase()
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0')
}
