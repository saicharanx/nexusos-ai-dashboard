import { useState, useEffect, memo } from 'react'
import { fmt12hm } from '../utils/time'

/** Minutes from now until "HH:MM" today (or tomorrow if already passed). */
function minsUntil(hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return null
  const [h, m] = hhmm.split(':').map(Number)
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  return Math.round((target - now) / 60000)
}

function fmtCountdown(mins) {
  if (mins == null) return null
  if (mins <= 0) return 'now'
  if (mins < 60) return mins + 'm'
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function ConfirmDelete({task, onYes, onNo}) {
  if (!task) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:9990,background:'rgba(0,0,0,.7)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
      <div style={{background:'var(--sf)',border:'1px solid var(--b2)',borderRadius:14,padding:'24px 28px',width:300,textAlign:'center',animation:'mci .25s ease'}}>
        <div style={{fontSize:22,marginBottom:10}}>✅</div>
        <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Did you finish the task?</div>
        <div style={{fontSize:12,color:'var(--t2)',marginBottom:20,fontStyle:'italic'}}>"{task.name}"</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <button onClick={onYes} style={{padding:'9px',borderRadius:9,background:'var(--ac)',border:'none',color:'#fff',fontFamily:'var(--fn)',fontSize:12,fontWeight:600,cursor:'pointer'}}>Yes</button>
          <button onClick={onNo}  style={{padding:'9px',borderRadius:9,background:'var(--s2)',border:'1px solid var(--b2)',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:12,cursor:'pointer'}}>No</button>
        </div>
      </div>
    </div>
  );
}

// ── TASK PANEL ──────────────────────────────────────────────────────────────
function TaskPanel({tasks,onDelete}) {
  const [confirmTask, setConfirmTask] = useState(null);
  const [, forceTick] = useState(0);
  // Re-render every 30s so the countdown stays current.
  useEffect(()=>{const id=setInterval(()=>forceTick(t=>t+1),30000);return()=>clearInterval(id);},[]);
  const pending=tasks.filter(t=>!t.done).length;
  const pCol={HIGH:'#ff5c5c',MEDIUM:'#9898b0',LOW:'#3dffa0'};
  const pBg={HIGH:'rgba(255,92,92,.12)',MEDIUM:'rgba(152,152,176,.12)',LOW:'rgba(61,255,160,.12)'};

  // Find the soonest upcoming reminder for the live countdown.
  const next = tasks
    .filter(t=>!t.done && t.remind_at)
    .map(t=>({t, mins: minsUntil(t.remind_at)}))
    .filter(x=>x.mins!=null)
    .sort((a,b)=>a.mins-b.mins)[0];

  return (
    <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column',height:'100%'}}>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'1.5px',color:'var(--t3)',textTransform:'uppercase'}}>To-Do Tasks</span>
        <span style={{fontSize:10,fontFamily:'var(--mo)',background:'var(--ag)',color:'var(--a2)',border:'1px solid rgba(108,99,255,.3)',borderRadius:4,padding:'1px 6px'}}>{pending} task{pending!==1?'s':''}</span>
      </div>
      {next&&(
        <div style={{padding:'6px 14px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',gap:7,fontSize:10,color:'var(--t2)',fontFamily:'var(--mo)',background:'var(--s2)',flexShrink:0}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'var(--ac)',boxShadow:'0 0 6px var(--ac)',animation:'pd 2s infinite',flexShrink:0}}/>
          <span style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Next: {next.t.name} in <span style={{color:'var(--a2)',fontWeight:600}}>{fmtCountdown(next.mins)}</span></span>
        </div>
      )}
      <div style={{flex:1,overflowY:'auto',padding:10}}>
        {tasks.length===0?(
          <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:11}}>
            <div style={{fontSize:26,marginBottom:6}}>✓</div>
            Tell the agent: "remind me to attend standup at 5 PM"
          </div>
        ):tasks.map(t=>(
          <div key={t.id} style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:10,padding:'9px 11px',marginBottom:7,display:'flex',alignItems:'flex-start',gap:9,position:'relative',transition:'.2s'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--b2)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--br)'}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:'var(--tx)'}}>{t.name}</div>
              <div style={{fontSize:10,color:'var(--t3)',marginTop:2,fontFamily:'var(--mo)',display:'flex',gap:6,alignItems:'center'}}>
                <span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:3,color:pCol[t.priority]||pCol.MEDIUM,background:pBg[t.priority]||pBg.MEDIUM}}>{t.priority}</span>
                {t.remind_at&&<span>⏰ {fmt12hm(t.remind_at)}</span>}
              </div>
            </div>
            <button onClick={e=>{e.stopPropagation();setConfirmTask(t);}} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:13,padding:3,lineHeight:1}}
              onMouseEnter={e=>e.target.style.color='#ff5c5c'} onMouseLeave={e=>e.target.style.color='var(--t3)'}>✕</button>
          </div>
        ))}
      </div>
      {confirmTask&&<ConfirmDelete task={confirmTask} onYes={()=>{onDelete(confirmTask.id);setConfirmTask(null);}} onNo={()=>setConfirmTask(null)}/>}
    </div>
  );
}

// ── MAIL PANEL ──────────────────────────────────────────────────────────────

export default memo(TaskPanel)
export { ConfirmDelete }
