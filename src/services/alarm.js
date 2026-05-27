let _ctx = null
let _interval = null

/** Play repeating alarm beeps. AudioContext created lazily (requires prior user gesture). */
export function playAlarm() {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
    else if (_ctx.state === 'suspended') _ctx.resume()

    if (_interval) { clearInterval(_interval); _interval = null }

    const beep = () => {
      try {
        const ctx = _ctx
        const t = ctx.currentTime
        ;[
          [880, 0, 0.2, 0.3], [1100, 0.22, 0.15, 0.25],
          [880, 0.42, 0.2, 0.3], [1320, 0.66, 0.3, 0.35],
        ].forEach(([f, st, dur, vol]) => {
          const o = ctx.createOscillator(), g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.frequency.value = f; o.type = 'sine'
          g.gain.setValueAtTime(vol, t + st)
          g.gain.exponentialRampToValueAtTime(0.001, t + st + dur)
          o.start(t + st); o.stop(t + st + dur + 0.05)
        })
      } catch { /* ignore */ }
    }

    beep()
    _interval = setInterval(beep, 2000)
  } catch (e) { console.warn('[Alarm]', e.message) }
}

export function stopAlarm() {
  if (_interval) { clearInterval(_interval); _interval = null }
  if (_ctx) { try { _ctx.close() } catch { /* ignore */ } _ctx = null }
}
