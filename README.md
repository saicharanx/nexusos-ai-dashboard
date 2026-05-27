# NexusOS — AI Agent Dashboard

A personal AI dashboard for a busy IT professional. A single screen that keeps you informed, lets you take quick actions, and uses an AI agent that calls real tools and returns live, real-time information — no dummy data.

**Live demo:** 
https://nexusos-ai-dashboard.vercel.app/

---

## What it does

- **Conversational AI agent** (Groq / Llama 3.3 70B) — answers freely, reasons over live dashboard context (time, weather, tasks, inbox), creates reminders, and drafts email replies. Greets you proactively on load with a live summary of your day.
- **Smart reminders + alarms** — say "remind me to attend standup at 5 PM" and it adds a task; when the desktop clock matches, a glowing alarm fires with sound and Finish / Snooze 5·10·20 controls. A live "next reminder in Xm" countdown keeps it current.
- **Gmail integration** — OAuth sign-in, reads unread mail, reply directly from the dashboard (replied mail is removed instantly).
- **Live weather** — real conditions from OpenWeatherMap at your location (GPS with IP fallback). Animated background responds to both condition (clear/cloud/rain/snow/storm/fog x time-of-day) and a continuous temperature-driven colour wash.
- **Live news ticker** — real GNews headlines, scrolling, click for an AI-generated summary. 10-minute cache, refresh every 2 cycles, n8n fallback.
- **Persistent session** — login survives refresh; profile picture + name in the header.

## Tech stack

- **Frontend:** React 18 + Vite
- **AI:** Groq API (Llama 3.3 70B) for chat + summaries
- **Automation backend:** n8n (dashboard aggregation, email/news fallback)
- **APIs:** Gmail (OAuth), OpenWeatherMap, GNews, ipapi.co (geolocation)
- **Hosting:** Vercel

---

## Architecture

```
+---------------------------------------------------------------+
|                        App.jsx (state)                        |
|   chat - tasks - emails - weather - ticker - proactive greet  |
+---------------+-------------------------------+---------------+
                |                               |
        +-------+--------+              +--------+---------+
        |   hooks/       |              |   components/    |
        |  useWeather    |              |  WeatherCircle   |
        |  useTasks      |              |  TaskPanel       |
        |  useGmail      |              |  MailPanel       |
        +-------+--------+              |  ChatBar         |
                |                       |  TickerBar ...   |
        +-------+---------------+       +------------------+
        |      services/        |
        |  llm.js     -> Groq   |
        |  gnews.js   -> GNews  |
        |  weather.js -> OWM    |
        |  gmail.js   -> Gmail  |
        |  dashboard.js -> n8n  |
        +-----------------------+
```

**Layering.** UI components are presentational; React hooks (`useWeather`, `useTasks`, `useGmail`) own state and side-effects; `services/` are the only place that talks to external APIs; `utils/` holds pure helpers (time formatting, JSON normalization, fetch-with-timeout, the reminder command parser). `config.js` is the single source of truth for env-var reads.

**Data flow.** On load, `App.jsx` fires `fetchGNews()` (ticker) and `fetchDashboard()` (n8n) in parallel, `useWeather` resolves location then calls OWM, and `useGmail` restores any saved session. Once weather is ready, a one-time proactive greeting summarizes the live state into the chat.

**The AI agent.** User messages first hit a deterministic command parser (`utils/reminderParser.js`) that catches explicit "remind me..." phrases and creates tasks locally — instant and offline-safe. Everything else goes to Groq (`services/llm.js`) with a system prompt that injects live context (time, weather, tasks, inbox) and can emit `|||TASK|||` / `|||SEND_EMAIL|||` markers that `App.jsx` parses into real actions. The chatbot is genuinely conversational, never keyword-scripted.

**Fallback chains (no fake data).** Every integration degrades honestly:
- Chat: Groq -> if no key, shows `AI assistant unavailable` (never faked).
- News: GNews (10-min cached) -> n8n news -> empty ticker.
- Weather: GPS -> IP geolocation (ipapi.co) -> default coords.
- Email: Gmail OAuth -> n8n email summary -> "Connect Gmail" prompt.
- All network calls use a 20s AbortController timeout (`utils/fetchWithTimeout.js`).

---

## Setup (run it yourself)

```bash
git clone https://github.com/saicharanx/nexusos-ai-dashboard.git
cd nexusos-ai-dashboard
npm install
cp .env.example .env      # then add your own keys (all free tiers)
npm run dev
```

| Variable | Where to get it (free) | Powers |
|---|---|---|
| `VITE_GROQ_API_KEY` | console.groq.com | AI chat + summaries |
| `VITE_GNEWS_API_KEY` | gnews.io | news ticker |
| `VITE_OWM_KEY` | openweathermap.org | weather |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console (OAuth) | Gmail login |
| `VITE_N8N_WEBHOOK_URL` | your n8n instance (optional) | dashboard aggregation |

Restart the dev server after editing `.env` (Vite reads it at startup). Any missing key degrades that one feature gracefully — no hardcoded or fake data anywhere.

## Deploy your own (Vercel)

1. Fork/import the repo into Vercel (auto-detects Vite: build `npm run build`, output `dist`).
2. Add the five `VITE_*` variables above under **Environment Variables** (Production).
3. Deploy. Changing env vars later requires a **redeploy** (uncheck build cache) since Vite inlines them at build time.
4. **Gmail on a deployed domain:** add your deployment URL to **Authorized JavaScript origins** and **Authorized redirect URIs** in your Google OAuth client, or sign-in will fail.

> **Note on secrets:** this is a frontend-only app, so `VITE_*` keys are inlined into the client bundle and are visible to anyone who inspects it. Use free, rotatable keys and regenerate them if the deployment is ever shared publicly. Moving secrets behind a small serverless proxy is the recommended next step (see below).

## n8n dependency

The dashboard can aggregate data via an n8n webhook (`VITE_N8N_WEBHOOK_URL`). This is **optional** — without it, news comes from GNews and email from Gmail OAuth directly. To use your own, point the variable at any n8n workflow that returns a `dashboard_data` JSON object (see `services/dashboard.js` -> `normalizeDashboard` for the accepted shape).

## Key decisions

- **Groq-only conversational chatbot** — never keyword-scripted. A small deterministic parser handles explicit "remind me..." commands instantly; every other message goes to the live model.
- **Graceful degradation over fake data** — every integration has a real fallback or an honest "unavailable" state.
- **Strict service/UI separation** — external APIs are isolated in `services/`, making each integration swappable.
- **Frontend-only** — fast to build and deploy; keys via environment variables.

## What I'd improve

- **Move secrets server-side** — a thin serverless proxy would keep API keys out of the client bundle entirely.
- **Richer agent tools** — calendar integration, multi-step planning, email triage.
- **Offline-first reminders** via service workers so alarms fire even if the tab is closed.
- **Test coverage** for the reminder parser and the data-normalization layer.
