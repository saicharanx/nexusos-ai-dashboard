function NewsModal({article, onClose}) {
  if (!article) return null;
  const ts = new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  // Build a human summary: prefer desc/one_line_impact from n8n payload, else show headline
  const summary = article.loading
    ? null
    : (article.desc && article.desc !== article.h
        ? article.desc
        : 'No additional summary available. Click "Read full article" to view the source.');

  return (
    <div style={{position:'fixed',inset:0,zIndex:995,background:'rgba(0,0,0,.84)',display:'flex',alignItems:'flex-end',justifyContent:'center',backdropFilter:'blur(5px)'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--sf)',border:'1px solid var(--b2)',borderTop:'2px solid var(--ac)',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:640,maxHeight:'65vh',display:'flex',flexDirection:'column',animation:'mci .28s cubic-bezier(.4,0,.2,1)'}}>
        {/* Header */}
        <div style={{padding:'16px 20px 14px',borderBottom:'1px solid var(--br)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:8,flexWrap:'wrap'}}>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:.8,color:'var(--a2)',background:'var(--ag)',border:'1px solid rgba(108,99,255,.28)',borderRadius:4,padding:'2px 8px',flexShrink:0}}>{article.tag||'TECH'}</span>
              {article.src&&<span style={{fontSize:11,color:'var(--t2)',fontWeight:600}}>{article.src}</span>}
              <span style={{fontSize:10,color:'var(--t3)',fontFamily:'var(--mo)'}}>{ts}</span>
            </div>
            <div style={{fontSize:15,fontWeight:700,lineHeight:1.45,color:'var(--tx)'}}>{article.h}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',fontSize:22,cursor:'pointer',padding:'0 2px',lineHeight:1,flexShrink:0,marginTop:-2}}>✕</button>
        </div>
        {/* Body */}
        <div style={{padding:'16px 20px 20px',overflowY:'auto',flex:1}}>
          {article.loading
            ? <div style={{display:'flex',alignItems:'center',gap:10,color:'var(--t3)',fontSize:12}}><div style={{width:12,height:12,border:'2px solid var(--b2)',borderTopColor:'var(--ac)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>Generating AI summary…</div>
            : <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.85,whiteSpace:'pre-wrap'}}>{summary||article.desc||article.h}</div>
          }
          {article.url&&(
            <a href={article.url} target="_blank" rel="noopener"
              style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:18,fontSize:12,color:'var(--a2)',textDecoration:'none',border:'1px solid rgba(108,99,255,.32)',borderRadius:8,padding:'7px 14px',transition:'background .2s'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--ag)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              Read full article ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TICKER BAR — CSS animation, animationiteration for cycle counting ─────────

export default NewsModal
