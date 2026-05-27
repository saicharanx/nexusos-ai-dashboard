import { useState, useRef, useEffect } from 'react'

function ChatBar({open,onOpen,onClose,messages,onSend,loading}) {
  const [val,setVal]=useState('');
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[messages,loading]);
  const send=()=>{if(!val.trim())return;onSend(val.trim());setVal('');};
  return (
    <div style={{background:'var(--sf)',borderTop:'1px solid var(--br)',display:'flex',flexDirection:'column',overflow:'hidden',transition:'all .5s cubic-bezier(.4,0,.2,1)',flexShrink:0,...(open?{position:'fixed',bottom:0,left:0,right:0,height:'58vh',zIndex:200,borderTop:'1px solid var(--b2)',boxShadow:'0 -20px 60px rgba(0,0,0,.6)'}:{})}}>
      {open&&(
        <div ref={ref} style={{flex:1,overflowY:'auto',padding:'10px 16px',display:'flex',flexDirection:'column',gap:8}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',gap:7,alignItems:'flex-start',flexDirection:m.role==='user'?'row-reverse':'row',animation:'msgIn .3s ease'}}>
              <div style={{width:24,height:24,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,background:m.role==='user'?'linear-gradient(135deg,#3dffa0,#4dc3ff)':'linear-gradient(135deg,var(--ac),#9b59b6)',color:m.role==='user'?'#000':'#fff'}}>{m.role==='user'?'ME':'✦'}</div>
              <div style={{maxWidth:'78%',padding:'8px 12px',borderRadius:12,fontSize:12,lineHeight:1.55,...(m.role==='user'?{background:'var(--ac)',color:'#fff',borderBottomRightRadius:3}:{background:'var(--s3)',border:'1px solid var(--b2)',color:'var(--tx)',borderBottomLeftRadius:3})}}
                dangerouslySetInnerHTML={{__html:m.content.replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}>
              </div>
            </div>
          ))}
          {messages.length<=2&&!loading&&(
            <div style={{display:'flex',flexWrap:'wrap',gap:7,padding:'2px 0 2px 31px'}}>
              {["What's important today?","Remind me to attend standup at 5 PM","Summarize my unread emails","What's the weather like?"].map((q,i)=>(
                <button key={i} onClick={()=>onSend(q)}
                  style={{background:'var(--s3)',border:'1px solid var(--b2)',borderRadius:14,padding:'6px 12px',color:'var(--a2)',fontSize:11,fontFamily:'var(--fn)',cursor:'pointer',transition:'.15s',whiteSpace:'nowrap'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--ag)';e.currentTarget.style.borderColor='var(--ac)';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--s3)';e.currentTarget.style.borderColor='var(--b2)';}}>
                  {q}
                </button>
              ))}
            </div>
          )}
          {loading&&(
            <div style={{display:'flex',gap:7,alignItems:'flex-start'}}>
              <div style={{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,var(--ac),#9b59b6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff'}}>✦</div>
              <div style={{padding:'8px 12px',borderRadius:12,background:'var(--s3)',border:'1px solid var(--b2)'}}>
                <div style={{display:'flex',gap:4}}>{[0,.2,.4].map((d,i)=><span key={i} style={{width:5,height:5,borderRadius:'50%',background:'var(--t3)',display:'inline-block',animation:`db2 1.2s ${d}s infinite`}}/>)}</div>
              </div>
            </div>
          )}
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',borderTop:open?'1px solid var(--br)':'none',background:'var(--sf)',flexShrink:0}}>
        <span style={{fontSize:10,fontWeight:600,letterSpacing:'1.5px',color:'var(--t3)',textTransform:'uppercase',whiteSpace:'nowrap'}}>AI Agent</span>
        <input value={val} onChange={e=>setVal(e.target.value)} onFocus={onOpen} onKeyDown={e=>e.key==='Enter'&&send()}
          placeholder="Ask me anything — remind me, what's important today, show emails…"
          autoComplete="off"
          style={{flex:1,background:'var(--s3)',border:'1px solid var(--b2)',borderRadius:22,padding:'8px 14px',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:12,outline:'none',transition:'.2s'}}/>
        <button onClick={send} style={{width:32,height:32,borderRadius:'50%',background:'var(--ac)',border:'none',cursor:'pointer',color:'#fff',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>➤</button>
        {open&&<button onClick={onClose} style={{background:'var(--s3)',border:'1px solid var(--b2)',borderRadius:7,color:'var(--t3)',cursor:'pointer',padding:'5px 10px',fontSize:11,fontFamily:'var(--fn)',whiteSpace:'nowrap'}}>✕ Close</button>}
      </div>
    </div>
  );
}

// ── ALARM MODAL ──────────────────────────────────────────────────────────────

export default ChatBar
