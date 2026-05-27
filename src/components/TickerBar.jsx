import { useRef, useEffect, useState, useMemo } from 'react'

function TickerBar({items, onItemClick, onRefresh}) {
  const trackRef  = useRef(null);
  const cycleRef  = useRef(0);
  const [paused, setPaused] = useState(false);

  const doubled = useMemo(() => items.length > 0 ? [...items,...items] : [], [items]);

  // Use animationiteration event — zero rAF overhead
  useEffect(()=>{
    if (!trackRef.current || items.length === 0) return;
    cycleRef.current = 0;
    const track = trackRef.current;
    const onIter = () => {
      cycleRef.current += 1;
      if (cycleRef.current >= 2) {
        cycleRef.current = 0;
        onRefresh && onRefresh();
      }
    };
    track.addEventListener('animationiteration', onIter);
    return () => track.removeEventListener('animationiteration', onIter);
  }, [items]);

  if (items.length === 0) {
    return (
      <div style={{borderTop:'1px solid var(--br)',background:'var(--s2)',display:'flex',alignItems:'center',height:44,overflow:'hidden',flexShrink:0}}>
        <div style={{background:'var(--ac)',color:'#fff',fontSize:10,fontWeight:700,letterSpacing:1,padding:'0 12px',height:'100%',display:'flex',alignItems:'center',flexShrink:0,textTransform:'uppercase',whiteSpace:'nowrap'}}>📡 IT LIVE</div>
        <div style={{flex:1,display:'flex',alignItems:'center',padding:'0 16px',color:'var(--t3)',fontSize:11}}>
          <div style={{width:10,height:10,border:'2px solid var(--b2)',borderTopColor:'var(--ac)',borderRadius:'50%',animation:'spin .8s linear infinite',marginRight:8}}/>
          Loading live headlines…
        </div>
      </div>
    );
  }

  return (
    <div style={{borderTop:'1px solid var(--br)',background:'var(--s2)',display:'flex',alignItems:'center',height:44,overflow:'hidden',flexShrink:0}}>
      <div style={{background:'var(--ac)',color:'#fff',fontSize:10,fontWeight:700,letterSpacing:1,padding:'0 12px',height:'100%',display:'flex',alignItems:'center',flexShrink:0,textTransform:'uppercase',whiteSpace:'nowrap'}}>📡 IT LIVE</div>
      <div style={{flex:1,overflow:'hidden',height:'100%'}}
        onMouseEnter={()=>setPaused(true)}
        onMouseLeave={()=>setPaused(false)}>
        <div ref={trackRef}
          style={{
            display:'inline-flex',alignItems:'center',height:'100%',whiteSpace:'nowrap',
            animation:'tickerSlide 80s linear infinite',
            animationPlayState: paused ? 'paused' : 'running',
            willChange:'transform',
          }}>
          {doubled.map((item,i)=>(
            <span key={i} onClick={()=>onItemClick&&onItemClick(item)}
              style={{display:'inline-flex',alignItems:'center',gap:8,padding:'0 24px',fontSize:12,color:'var(--t2)',cursor:'pointer',flexShrink:0,userSelect:'none',transition:'color .15s'}}
              onMouseEnter={e=>e.currentTarget.style.color='var(--tx)'}
              onMouseLeave={e=>e.currentTarget.style.color='var(--t2)'}>
              <span style={{width:4,height:4,borderRadius:'50%',background:'var(--ac)',flexShrink:0,display:'inline-block'}}/>
              <span style={{fontSize:10,color:'var(--a2)',background:'var(--ag)',border:'1px solid rgba(108,99,255,.2)',borderRadius:3,padding:'0 5px',fontWeight:600,flexShrink:0}}>{item.tag}</span>
              <span>{item.h}</span>
              <span style={{color:'var(--t3)',fontSize:10,marginLeft:2,flexShrink:0}}>— {item.src}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}


// ── TOAST ─────────────────────────────────────────────────────────────────────

export default TickerBar
