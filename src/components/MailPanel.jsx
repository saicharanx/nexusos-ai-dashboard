import { memo } from 'react'

function MailPanel({gToken,onSignIn,emails,loading,onOpenMail}) {
  return (
    <div style={{background:'var(--sf)',border:'1px solid var(--br)',borderRadius:14,overflow:'hidden',display:'flex',flexDirection:'column',height:'100%',position:'relative',maxWidth:560,minWidth:340,width:'100%'}}>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--br)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <span style={{fontSize:11,fontWeight:600,letterSpacing:'1.5px',color:'var(--t3)',textTransform:'uppercase'}}>Unread Mails</span>
        <span style={{fontSize:10,fontFamily:'var(--mo)',background:'var(--ag)',color:'var(--a2)',border:'1px solid rgba(108,99,255,.3)',borderRadius:4,padding:'1px 6px'}}>{emails?emails.length+' unread':'--'}</span>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:10,minHeight:0}}>
        {loading&&[0,1,2,3].map(i=>(
          <div key={i} style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:10,padding:'10px 12px',marginBottom:7}}>
            {[ '60%','85%','45%' ].map((w,j)=>(
              <div key={j} style={{height:9,width:w,borderRadius:5,marginBottom:j<2?7:0,background:'linear-gradient(90deg,var(--s3) 0px,var(--b2) 80px,var(--s3) 160px)',backgroundSize:'400px 100%',animation:`shimmer 1.4s ${i*0.1}s infinite linear`}}/>
            ))}
          </div>
        ))}
        {!loading&&emails&&emails.map(e=>(
          <div key={e.id} onClick={()=>onOpenMail(e.id)} style={{background:'var(--s2)',border:'1px solid var(--br)',borderRadius:10,padding:'10px 12px',marginBottom:7,cursor:'pointer',position:'relative',paddingLeft:15,transition:'.2s'}}
            onMouseEnter={el=>el.currentTarget.style.borderColor='var(--b2)'} onMouseLeave={el=>el.currentTarget.style.borderColor='var(--br)'}>
            <div style={{position:'absolute',left:5,top:'50%',transform:'translateY(-50%)',width:5,height:5,borderRadius:'50%',background:'var(--ac)'}}/>
            <div style={{fontSize:11,fontWeight:600,display:'flex',justifyContent:'space-between',gap:6}}>
              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'65%'}}>{e.from}</span>
              <span style={{fontSize:10,color:'var(--t3)',fontFamily:'var(--mo)',flexShrink:0}}>{e.time}</span>
            </div>
            <div style={{fontSize:11,color:'var(--t2)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.subject}</div>
            <div style={{fontSize:10,color:'var(--t3)',marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{(e.snippet||'').substring(0,90)}</div>
          </div>
        ))}
        {!loading&&emails&&emails.length===0&&<div style={{textAlign:'center',color:'var(--t3)',padding:20,fontSize:11}}>No unread emails 🎉</div>}
      </div>
      {!gToken&&(
        <div style={{position:'absolute',inset:0,background:'var(--sf)',zIndex:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,borderRadius:14,padding:20}}>
          <div style={{fontSize:32}}>📬</div>
          <div style={{fontSize:13,fontWeight:600}}>Connect Gmail</div>
          <div style={{fontSize:11,color:'var(--t3)',textAlign:'center',maxWidth:220,lineHeight:1.6}}>Sign in with Google to view and reply to unread emails directly from this dashboard</div>
          <button onClick={onSignIn} style={{display:'flex',alignItems:'center',gap:10,background:'#fff',color:'#333',border:'none',borderRadius:8,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--fn)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}

// ── CHAT BAR ─────────────────────────────────────────────────────────────────

export default memo(MailPanel)
