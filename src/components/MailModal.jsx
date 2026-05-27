import { useState, useEffect } from 'react'
import { fetchGmailBody, sendGmailReply } from '../services/gmail'

function MailModal({mail,onClose,gToken,onSendReply,onMarkRead}) {
  const [reply,setReply]=useState('');
  const [sending,setSending]=useState(false);
  const [bodyText,setBodyText]=useState(mail.body||mail.snippet||'Loading…');
  useEffect(()=>{
    setBodyText(mail.body||mail.snippet||'');
    if (gToken && gToken !== 'n8n-linked' && mail.id && !mail.body) {
      fetchGmailBody(gToken,mail.id).then(b=>setBodyText(b)).catch(()=>{});
    }
  },[mail.id]);
  const doSend=async()=>{
    if(!reply.trim())return;
    setSending(true);
    try{
      if(gToken && gToken!=='n8n-linked'){
        const resp = await sendGmailReply(gToken,reply,mail);
        console.log('GMAIL REPLY RESPONSE:', resp);
        onSendReply('✓ Reply sent!', mail.id);
      } else {
        onSendReply('⚠️ Connect Gmail to send real replies', null);
      }
      setReply('');onClose();
    }catch(e){
      console.error('GMAIL REPLY ERROR:', e);
      onSendReply('Error: '+e.message, null);
    }finally{setSending(false);}
  };
  return (
    <div style={{position:'fixed',inset:0,zIndex:990,background:'rgba(0,0,0,.82)',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
      <div style={{background:'var(--sf)',border:'1px solid var(--b2)',borderRadius:18,width:560,maxHeight:'82vh',overflow:'hidden',display:'flex',flexDirection:'column',animation:'mci .3s cubic-bezier(.4,0,.2,1)'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--br)',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><div style={{fontSize:14,fontWeight:600}}>{mail.subject}</div><div style={{fontSize:11,color:'var(--t2)',marginTop:3}}>From: {mail.from} · {mail.time}</div></div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',fontSize:18,cursor:'pointer',padding:3}}>✕</button>
        </div>
        <div style={{padding:18,flex:1,overflowY:'auto',fontSize:12,lineHeight:1.75,color:'var(--t2)',whiteSpace:'pre-wrap'}}>{bodyText}</div>
        <div style={{borderTop:'1px solid var(--br)',padding:'12px 18px'}}>
          <textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Write your reply…" rows={3}
            style={{width:'100%',background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:9,padding:'9px 12px',color:'var(--tx)',fontFamily:'var(--fn)',fontSize:12,resize:'none',outline:'none',minHeight:75}}/>
          <button onClick={doSend} disabled={sending} style={{marginTop:7,padding:'8px 18px',background:sending?'var(--s3)':'var(--ac)',border:'none',borderRadius:7,color:'#fff',fontFamily:'var(--fn)',fontSize:12,cursor:sending?'not-allowed':'pointer'}}>
            {sending?'Sending…':'Send Reply ↗'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NEWS READER ───────────────────────────────────────────────────────────────

export default MailModal
