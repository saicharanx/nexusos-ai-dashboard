import { useState, useRef, useCallback } from 'react'
import { GROQ_API_KEY } from './config'
import { hm, hm24, fmt12hm, parse12to24 } from './utils/time'
import { parseReminderCommand } from './utils/reminderParser'
import { fetchDashboard, mapTasks, mapEmails, mapTicker } from './services/dashboard'
import { fetchGNews } from './services/gnews'
import { fetchGmailBody, sendGmailReply } from './services/gmail'
import { callLLM, LLM_UNAVAILABLE } from './services/llm'
import { stopAlarm } from './services/alarm'
import { useWeather } from './hooks/useWeather'
import { useTasks } from './hooks/useTasks'
import { useGmail } from './hooks/useGmail'

import WeatherCircle from './components/WeatherCircle'
import TaskPanel from './components/TaskPanel'
import MailPanel from './components/MailPanel'
import ChatBar from './components/ChatBar'
import AlarmModal from './components/AlarmModal'
import MailModal from './components/MailModal'
import NewsModal from './components/NewsModal'
import TickerBar from './components/TickerBar'
import Toast from './components/Toast'
import { useEffect } from 'react'

export default function App() {
  // ── Core state ────────────────────────────────────────────────────────────
  const weather = useWeather()
  const { tasks, setTasks, addTask, deleteTask, alarm, clearAlarm, snoozeAlarm, finishAlarm } = useTasks()
  const { gToken, setGToken, userProfile, emails, setEmails, removeEmail, loading: emailsLoading, signIn, logout } = useGmail()

  const [chatOpen,    setChatOpen]    = useState(false)
  const [chatMsgs,    setChatMsgs]    = useState([{ role: 'assistant', content: "👋 Hey! I'm your NexusOS AI. Ask me anything — \"what's important today?\", \"remind me to check server at 6 PM\", \"reply to Rahul saying I'll join tomorrow\"." }])
  const [chatLoading, setChatLoading] = useState(false)
  const [openMail,    setOpenMail]    = useState(null)
  const [ticker,      setTicker]      = useState([])
  const [newsModal,   setNewsModal]   = useState(null)
  const [toast,       setToast]       = useState('')

  const dashRef      = useRef(null)
  const gmailCache   = useRef({})
  const tickFetching = useRef(false)
  const greetedRef   = useRef(false)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Load dashboard data (n8n) ─────────────────────────────────────────────
  useEffect(() => {
    // News ticker: try GNews first (live headlines + 10-min cache).
    fetchGNews()
      .then((items) => { if (items?.length) setTicker(items) })
      .catch((err) => console.warn('[GNews]', err.message))

    fetchDashboard()
      .then((dash) => {
        if (!dash?.dashboard_data) return
        dashRef.current = dash
        const d = dash.dashboard_data
        const aiTasks = mapTasks(d.action_items || d.tasks || d.todo || [])
        if (aiTasks.length) {
          setTasks((prev) => {
            const existing = new Set(prev.map((t) => t.name.toLowerCase()))
            const newOnes  = aiTasks.filter((t) => !existing.has(t.name.toLowerCase()))
            return newOnes.length ? [...prev, ...newOnes] : prev
          })
        }
        if (!gToken) {
          const mapped = mapEmails(d.email_summary || d.emails || d.unread_emails || [])
          if (mapped.length) { setEmails(mapped); setGToken('n8n-linked') }
        }
        // Fallback: only use n8n news if GNews didn't already populate the ticker.
        const tick = mapTicker(
          d.tech_news_digest, d.ai_news_highlights, d.business_insights,
          d.hacker_news_highlights, d.security_cve_alerts, d.arxiv_papers, d.github_trending,
          d.news, d.headlines, d.ai_news, d.tech_news, d.news_digest
        )
        if (tick.length) setTicker((prev) => (prev.length ? prev : tick))
      })
      .catch((err) => console.warn('[Dashboard]', err.message))
  }, []) // eslint-disable-line

  // ── Proactive AI greeting — fires once when live data is ready ─────────────
  // Shows the agent USING live context unprompted (weather, tasks, inbox).
  useEffect(() => {
    if (greetedRef.current) return
    if (weather.temp === '--') return // wait until weather actually loaded
    greetedRef.current = true

    const h = new Date().getHours()
    const partOfDay = h < 5 ? 'late night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
    const greet = h < 5 ? 'You\'re up late' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
    const who = userProfile?.name ? ', ' + userProfile.name.split(' ')[0] : ''

    const pending = tasks.filter((t) => !t.done).length
    const inbox   = emails?.length || 0

    const bits = []
    bits.push(`it's a ${weather.condition.l.toLowerCase()} ${weather.temp}°C ${partOfDay} in ${weather.city}`)
    bits.push(inbox ? `you have ${inbox} unread email${inbox === 1 ? '' : 's'}` : 'your inbox is clear')
    bits.push(pending ? `${pending} task${pending === 1 ? '' : 's'} pending` : 'no tasks scheduled yet')

    const tail = pending
      ? 'Want a rundown, or shall I set a new reminder?'
      : 'Tell me something like "remind me to attend standup at 5 PM" and I\'ll track it for you.'

    const msg = `${greet}${who} — ${bits.join(', ')}. ${tail}`
    setChatMsgs((m) => {
      // Replace the static intro if it's still the only message; else append.
      if (m.length === 1 && m[0].role === 'assistant') return [{ role: 'assistant', content: msg }]
      return [...m, { role: 'assistant', content: msg }]
    })
  }, [weather.temp]) // eslint-disable-line

  // ── Open mail (with full body fetch) ─────────────────────────────────────
  const handleOpenMail = async (mailId) => {
    const base = (emails || []).find((e) => e.id === mailId)
    if (!base) return
    let body = base.body || base.snippet || ''
    if (gToken && gToken !== 'n8n-linked' && !gmailCache.current[mailId]) {
      try { body = await fetchGmailBody(gToken, mailId); gmailCache.current[mailId] = body } catch { /* keep snippet */ }
    }
    setOpenMail({ ...base, body })
  }

  // ── Alarm handlers ────────────────────────────────────────────────────────
  const handleAlarmDone = () => {
    stopAlarm()
    finishAlarm()
    showToast('✓ Task finished and removed!')
  }
  const handleAlarmSnooze = (mins) => {
    stopAlarm()
    snoozeAlarm(mins)
    const d = new Date(); d.setMinutes(d.getMinutes() + mins)
    showToast('💤 Snoozed ' + mins + ' min — alarm reset to ' + fmt12hm(hm24(d)))
  }

  // ── News item click — generate AI summary ────────────────────────────────
  const handleNewsClick = useCallback(async (item) => {
    setNewsModal({ ...item, desc: item.desc || null, loading: true })
    if (!GROQ_API_KEY) {
      setNewsModal((prev) => prev ? { ...prev, loading: false } : null)
      return
    }
    try {
      const summary = await callLLM(
        [{ role: 'user', content: `Write a 2-3 paragraph summary of this tech news story for an IT professional.\nHeadline: "${item.h}"\nSource: ${item.src}${item.desc && item.desc !== item.h ? '\nContext: ' + item.desc : ''}` }],
        'You are a senior technology journalist. Be precise, actionable, and technically accurate.',
        400
      )
      const clean = summary === LLM_UNAVAILABLE ? null : summary
      setNewsModal((prev) => prev?.h === item.h ? { ...prev, desc: clean || prev.desc || item.h, loading: false } : prev)
    } catch {
      setNewsModal((prev) => prev?.h === item.h ? { ...prev, loading: false } : prev)
    }
  }, [])

  // ── Ticker refresh (fires after 2 scroll cycles) ─────────────────────────
  const handleTickerRefresh = useCallback(async () => {
    if (tickFetching.current) return
    tickFetching.current = true

    // GNews first — respects the 10-min cache, so this is cheap between refreshes.
    let usedGNews = false
    try {
      const items = await fetchGNews()
      if (items?.length) { setTicker(items); usedGNews = true }
    } catch (err) { console.warn('[GNews refresh]', err.message) }

    if (usedGNews) { tickFetching.current = false; return }

    // Fallback to n8n news only if GNews is unavailable.
    fetchDashboard()
      .then((dash) => {
        if (!dash?.dashboard_data) return
        const d    = dash.dashboard_data
        const tick = mapTicker(d.tech_news_digest, d.ai_news_highlights, d.business_insights, d.hacker_news_highlights, d.security_cve_alerts, d.arxiv_papers, d.github_trending, d.news, d.headlines)
        if (tick.length) setTicker(tick)
      })
      .catch((err) => console.warn('[TickerRefresh]', err.message))
      .finally(() => { tickFetching.current = false })
  }, [])

  // ── Chat handler — LLM only ───────────────────────────────────────────────
  const handleSend = async (text) => {
    setChatMsgs((m) => [...m, { role: 'user', content: text }])
    setChatLoading(true)
    await new Promise((r) => setTimeout(r, 0))

    // Fast-path: explicit reminder COMMANDS are handled locally so the To-Do
    // panel + alarm work even without a Groq key. This is a deterministic
    // command parser, NOT a chatbot reply — anything that isn't a reminder
    // command still goes to Groq below.
    const localReminder = parseReminderCommand(text)
    if (localReminder) {
      const newTask = {
        id: 'local-' + Date.now(),
        name: localReminder.name,
        remind_at: localReminder.remind_at,
        priority: localReminder.priority,
        done: false,
      }
      addTask(newTask)
      showToast('Task added: ' + newTask.name)
      const when = newTask.remind_at ? ' for ' + fmt12hm(newTask.remind_at) : ''
      setChatMsgs((m) => [...m, { role: 'assistant', content: `Got it — added "${newTask.name}"${when} to your tasks. ✅` }])
      setChatLoading(false)
      return
    }

    try {
      const d            = dashRef.current?.dashboard_data || {}
      const pendingTasks = tasks.filter((t) => !t.done)
      const emailList    = emails?.length ? emails : mapEmails(d.email_summary || [])
      const topNews      = [...(d.tech_news_digest || []), ...(d.ai_news_highlights || []), ...ticker].slice(0, 5)
      const now          = new Date()

      const ctxLines = [
        '=== LIVE DASHBOARD CONTEXT ===',
        'Current time: ' + hm(now) + ', ' + now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
        weather.temp !== '--' ? `Weather: ${weather.temp}°C, ${weather.condition.l} in ${weather.city}` : null,
        pendingTasks.length
          ? 'Tasks (' + pendingTasks.length + ' pending): ' + pendingTasks.slice(0, 5).map((t) => t.name + (t.remind_at ? ' @' + fmt12hm(t.remind_at) : '') + ' [' + t.priority + ']').join('; ')
          : 'Tasks: none',
        emailList.length
          ? 'Unread emails (' + emailList.length + '): ' + emailList.slice(0, 4).map((e) => 'from ' + e.from + ' — ' + e.subject).join('; ')
          : 'Emails: inbox clear',
        topNews.length ? 'Top headlines: ' + topNews.slice(0, 4).map((n) => n.title || n.headline || n.h).join(' | ') : null,
        '==============================',
      ].filter(Boolean).join('\n')

      const SYSTEM = `You are NexusOS AI, a sharp, friendly IT productivity assistant embedded in a personal dashboard.

PERSONALITY: Conversational, warm, direct. Short replies. Never robotic. Talk like a smart colleague.

TASK CREATION RULES:
You help users create reminders/tasks. A task needs: name, time, and priority.
- Collect them conversationally — never all at once.
- Once you have all 3, output at the END of your response:
  |||TASK|||{"name":"...","time":"HH:MM","priority":"HIGH|MEDIUM|LOW"}

Time parsing: "at 6pm" → "18:00", "at 1:45 AM" → "01:45", "in 20 mins" → compute from now, no time → null
Priority: urgent/critical/ASAP → HIGH; low-stakes/later → LOW; else → MEDIUM

EMAIL ACTIONS:
If user says "reply to [name] saying [message]", output at END:
|||SEND_EMAIL|||{"to":"[name]","body":"[message]"}

DASHBOARD QUERIES:
Answer questions about emails, weather, tasks, news using the context below.

NEVER: use keyword matching, make up data, ask multiple questions at once, be verbose.

${ctxLines}`

      const historyForLLM = [...chatMsgs.slice(-10).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })), { role: 'user', content: text }]
      const raw = await callLLM(historyForLLM, SYSTEM, 600)

      // No Groq key configured → exact required message, no fake reply.
      if (raw === LLM_UNAVAILABLE) {
        setChatMsgs((m) => [...m, { role: 'assistant', content: 'AI assistant unavailable' }])
        return
      }

      // Groq configured but the request failed/timed out.
      if (!raw) {
        setChatMsgs((m) => [...m, { role: 'assistant', content: '⚠️ The AI assistant didn\'t respond just now. Please try again in a moment.' }])
        return
      }

      let displayText = raw

      // Parse |||TASK||| marker
      const taskMarker = raw.indexOf('|||TASK|||')
      if (taskMarker !== -1) {
        displayText = raw.substring(0, taskMarker).trim()
        try {
          const m = raw.substring(taskMarker + 10).trim().match(/\{[\s\S]*?\}/)
          if (m) {
            const td = JSON.parse(m[0])
            if (td?.name) {
              let remindAt = td.time || null
              if (remindAt === 'null' || remindAt === 'none') remindAt = null
              if (remindAt?.includes('min')) { const mins = parseInt(remindAt); if (!isNaN(mins)) { const t2 = new Date(); t2.setMinutes(t2.getMinutes() + mins); remindAt = hm24(t2) } }
              if (remindAt && !/^\d{2}:\d{2}$/.test(remindAt)) remindAt = parse12to24(remindAt)
              const prio = (td.priority || 'MEDIUM').toUpperCase()
              const newTask = { id: 'llm-' + Date.now(), name: td.name, remind_at: remindAt, priority: ['HIGH', 'MEDIUM', 'LOW'].includes(prio) ? prio : 'MEDIUM', done: false }
              addTask(newTask)
              showToast('Task added: ' + newTask.name)
            }
          }
        } catch (e) { console.warn('Task parse:', e.message) }
      }

      // Parse |||SEND_EMAIL||| marker
      const emailSrc   = taskMarker !== -1 ? raw : displayText
      const emailIdx   = emailSrc.indexOf('|||SEND_EMAIL|||')
      if (emailIdx !== -1) {
        if (taskMarker === -1) displayText = displayText.substring(0, emailIdx).trim()
        try {
          const em = emailSrc.substring(emailIdx + 16).trim().match(/\{[\s\S]*?\}/)
          if (em) {
            const ed = JSON.parse(em[0])
            if (ed.to && ed.body && gToken && gToken !== 'n8n-linked') {
              const target = (emails || []).find((e) => (e.from || '').toLowerCase().includes(ed.to.toLowerCase()))
              if (target) {
                sendGmailReply(gToken, ed.body, target)
                  .then(() => { showToast('Reply sent to ' + target.from); removeEmail(target.id) })
                  .catch((err) => showToast('Reply failed: ' + err.message))
              }
            }
          }
        } catch (e) { console.warn('Email parse:', e.message) }
      }

      if (displayText) setChatMsgs((m) => [...m, { role: 'assistant', content: displayText }])

    } catch (e) {
      console.error('Chat error:', e)
      setChatMsgs((m) => [...m, { role: 'assistant', content: 'Hit a snag — ' + e.message }])
    } finally {
      setChatLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* TOPBAR */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:48, background:'var(--sf)', borderBottom:'1px solid var(--br)', flexShrink:0, zIndex:100 }}>
        <div style={{ fontSize:15, fontWeight:700, letterSpacing:2, color:'var(--a2)', display:'flex', alignItems:'center', gap:8 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#6C63FF" strokeWidth="1.5"/><path d="M5 9l3 3 5-5" stroke="#6C63FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          NEXUS<em style={{ color:'var(--t3)', fontStyle:'normal', fontWeight:400, fontSize:10, letterSpacing:1 }}>OS v4.0</em>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--gn)', boxShadow:'0 0 6px var(--gn)', animation:'pd 2s infinite' }}/>
          <div style={{ background:'var(--s3)', border:'1px solid var(--b2)', borderRadius:20, padding:'3px 10px 3px 4px', display:'flex', alignItems:'center', gap:7, fontSize:12 }}>
            {userProfile?.picture
              ? <img src={userProfile.picture} alt="" style={{ width:24, height:24, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
              : <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--ac),#ff6b9d)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{userProfile?.name ? userProfile.name[0].toUpperCase() : 'IT'}</div>
            }
            <span style={{ maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userProfile?.name || 'SysAdmin'}</span>
          </div>
          {userProfile && (
            <button onClick={logout}
              style={{ background:'none', border:'1px solid var(--br)', borderRadius:7, color:'var(--t3)', fontSize:10, padding:'4px 10px', cursor:'pointer', fontFamily:'var(--fn)', transition:'.15s' }}
              onMouseEnter={(e) => (e.target.style.color = '#ff5c5c')}
              onMouseLeave={(e) => (e.target.style.color = 'var(--t3)')}>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: chatOpen ? '180px 230px 1fr' : '1fr 230px 1.9fr',
        gap: 12, padding: 12, flex: 1, overflow: 'hidden',
        transition: 'all .5s cubic-bezier(.4,0,.2,1)',
      }}>
        <div style={{ opacity: chatOpen ? 0.25 : 1, transition: '.5s', pointerEvents: chatOpen ? 'none' : 'all' }}>
          <TaskPanel tasks={tasks} onDelete={deleteTask} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WeatherCircle weather={weather} />
        </div>
        <div style={{ opacity: chatOpen ? 0.25 : 1, transition: '.5s', pointerEvents: chatOpen ? 'none' : 'all' }}>
          <MailPanel gToken={gToken} onSignIn={signIn} emails={emails} loading={emailsLoading} onOpenMail={handleOpenMail} />
        </div>
      </div>

      {/* CHAT */}
      <ChatBar open={chatOpen} onOpen={() => setChatOpen(true)} onClose={() => setChatOpen(false)} messages={chatMsgs} onSend={handleSend} loading={chatLoading} />

      {/* NEWS TICKER */}
      <TickerBar items={ticker} onItemClick={handleNewsClick} onRefresh={handleTickerRefresh} />

      {/* OVERLAYS */}
      <AlarmModal alarm={alarm} onDone={handleAlarmDone} onSnooze={handleAlarmSnooze} />
      {newsModal && <NewsModal article={newsModal} onClose={() => setNewsModal(null)} />}
      {openMail && (
        <MailModal
          mail={openMail}
          onClose={() => setOpenMail(null)}
          gToken={gToken}
          onSendReply={(msg, removedId) => { showToast(msg); if (removedId) removeEmail(removedId); setOpenMail(null) }}
          onMarkRead={() => {}}
        />
      )}
      <Toast msg={toast} />
    </div>
  )
}
