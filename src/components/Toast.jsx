import { useState, useEffect, useRef } from 'react'

function Toast({ msg }) {
  const [vis, setVis] = useState(false)
  const timer = useRef(null)
  useEffect(() => {
    if (msg) { setVis(true); clearTimeout(timer.current); timer.current = setTimeout(() => setVis(false), 2600) }
    else setVis(false)
    return () => clearTimeout(timer.current)
  }, [msg])
  return (
    <div style={{ position:'fixed', bottom:60, left:'50%', transform:`translateX(-50%) translateY(${vis?0:20}px)`,
      background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:9, padding:'9px 16px', fontSize:12,
      color:'var(--tx)', transition:'.3s', opacity:vis?1:0, pointerEvents:'none', zIndex:9999, whiteSpace:'nowrap' }}>
      {msg}
    </div>
  )
}

export default Toast
