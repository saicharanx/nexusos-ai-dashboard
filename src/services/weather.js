import { OWM_KEY } from '../config'
import { hm } from '../utils/time'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

/** Map OWM condition id + hour to a scene key */
function resolveScene(condId, hr) {
  let cond = 'clear'
  if (condId >= 200 && condId < 300) cond = 'storm'
  else if (condId >= 300 && condId < 600) cond = 'rain'
  else if (condId >= 600 && condId < 700) cond = 'snow'
  else if (condId >= 700 && condId < 800) cond = 'fog'
  else if (condId >= 801) cond = 'cloud'

  const tod =
      hr >= 5 && hr < 7   ? 'dawn'      :
          hr >= 7 && hr < 12  ? 'morning'   :
              hr >= 12 && hr < 17 ? 'afternoon' :
                  hr >= 17 && hr < 20 ? 'dusk'      : 'night'

  const ICONS = {
    storm: '⛈️', rain: '🌧️', snow: '❄️', fog: '🌫️', cloud: '⛅',
    clear: { dawn: '🌅', morning: '☀️', afternoon: '🌤️', dusk: '🌇', night: '🌙' },
  }
  const icon = cond === 'clear' ? ICONS.clear[tod] : (ICONS[cond] || '🌤️')

  return { cond, tod, scene: cond + '-' + tod, icon }
}

/** Get current coords. Tries browser GPS first; if denied/unavailable,
 *  falls back to IP-based geolocation (free, no key) so the user still gets
 *  THEIR location instead of a hardcoded city. Returns null only if both fail.
 */
async function getCoords() {
  // 1. Browser GPS (most accurate). Needs https or localhost + user permission.
  const gps = await new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    let done = false
    const timer = setTimeout(() => { if (!done) { done = true; resolve(null) } }, 5000)
    navigator.geolocation.getCurrentPosition(
        (p) => { if (!done) { done = true; clearTimeout(timer); resolve({ lat: p.coords.latitude, lon: p.coords.longitude, src: 'gps' }) } },
        () => { if (!done) { done = true; clearTimeout(timer); resolve(null) } },
        { timeout: 5000, maximumAge: 600000 }
    )
  })
  if (gps) { console.log('[Weather] location via GPS'); return gps }

  // 2. IP-based fallback — works without permission, returns the user's real city.
  try {
    const r = await fetchWithTimeout('https://ipapi.co/json/', { headers: { Accept: 'application/json' } }, 8000)
    if (r.ok) {
      const j = await r.json()
      if (j.latitude && j.longitude) {
        console.log('[Weather] location via IP:', j.city, j.country_code)
        return { lat: j.latitude, lon: j.longitude, src: 'ip' }
      }
    }
  } catch (e) { console.warn('[Weather] IP geolocation failed:', e.message) }

  console.warn('[Weather] no location available — using default')
  return null
}

/** Fetch current weather from OpenWeatherMap */
export async function fetchWeather() {
  const coords = await getCoords()
  // Final fallback only if BOTH GPS and IP lookup fail (rare).
  const lat = coords?.lat ?? 17.3850
  const lon = coords?.lon ?? 78.4867

  if (!OWM_KEY) {
    // Return a minimal placeholder — don't break the app
    const hr = new Date().getHours()
    const { cond, tod, scene, icon } = resolveScene(800, hr)
    return { temp: '--', condition: { l: 'Configure OWM key', i: icon }, city: 'Your location', scene, cond, tod, humidity: '--', windKmh: '--', sunrise: '--', sunset: '--' }
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`
  const res = await fetchWithTimeout(url, {}, 20000)
  if (!res.ok) throw new Error('OWM HTTP ' + res.status)
  const d = await res.json()

  const hr       = new Date().getHours()
  const condId   = d.weather?.[0]?.id ?? 800
  const condRaw  = d.weather?.[0]?.description ?? 'clear sky'
  const { cond, tod, scene, icon } = resolveScene(condId, hr)

  return {
    temp:      Math.round(d.main?.temp ?? 0),
    condition: { l: condRaw.charAt(0).toUpperCase() + condRaw.slice(1), i: icon },
    city:      d.name ? `${d.name}, ${d.sys?.country ?? ''}`.replace(/,\s*$/, '') : 'Your location',
    scene, cond, tod,
    humidity:  d.main?.humidity ?? '--',
    windKmh:   d.wind?.speed != null ? Math.round(d.wind.speed * 3.6) : '--',
    sunrise:   d.sys?.sunrise ? hm(new Date(d.sys.sunrise * 1000)) : '--',
    sunset:    d.sys?.sunset  ? hm(new Date(d.sys.sunset  * 1000)) : '--',
  }
}
