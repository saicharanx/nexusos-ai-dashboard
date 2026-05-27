import { fmt12hm } from '../utils/time'

function AlarmModal({alarm,onDone,onSnooze}) {
  if (!alarm) return null;
  const disp = alarm.remind_at ? fmt12hm(alarm.remind_at) : '';
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,.88)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)'}}>
      <div style={{background:'var(--sf)',border:'1px solid rgba(108,99,255,.5)',borderRadius:22,padding:'36px 32px',width:360,textAlign:'center',animation:'alPulse 1.2s ease-in-out infinite'}}>
        <div style={{fontSize:52,marginBottom:12,display:'inline-block',animation:'ring .6s ease-in-out infinite'}}>🔔</div>
        <div style={{fontSize:19,fontWeight:700,marginBottom:6}}>"{alarm.name}"</div>
        <div style={{fontSize:13,color:'var(--t2)',marginBottom:6}}>Your task deadline is up. Did you finish it?</div>
        <div style={{fontSize:12,color:'var(--t3)',marginBottom:22,fontFamily:'var(--mo)'}}>{alarm.priority} · {disp}</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8}}>
          <button onClick={onDone} style={{padding:'10px 4px',borderRadius:10,background:'var(--ac)',border:'1px solid var(--ac)',color:'#fff',fontFamily:'var(--fn)',fontSize:12,cursor:'pointer',fontWeight:500}}>✓ Finish</button>
          {[5,10,20].map(m=>(
            <button key={m} onClick={()=>onSnooze(m)} style={{padding:'10px 4px',borderRadius:10,border:'1px solid var(--b2)',background:'var(--s2)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:12,cursor:'pointer',fontWeight:500}}>💤 {m}m</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MAIL MODAL ────────────────────────────────────────────────────────────────

export default AlarmModal
