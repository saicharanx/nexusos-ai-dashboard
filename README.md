# NexusOS — AI Agent Dashboard

A personal AI dashboard for a busy IT professional. A single screen that keeps you informed, lets you take quick actions, and uses an AI agent that calls real tools and returns live, real-time information — no dummy data.

**Live demo:** _(add your Vercel URL here after deploying)_

## What it does

- **Conversational AI agent** (Groq / Llama 3.3 70B) — answers freely, reasons over live dashboard context (time, weather, tasks, inbox), creates reminders, and drafts email replies. Greets you proactively on load with a live summary of your day.
- **Smart reminders + alarms** — say "remind me to attend standup at 5 PM" and it adds a task; when the desktop clock matches, a glowing alarm fires with sound and Finish / Snooze 5·10·20 controls. A live "next reminder in Xm" countdown keeps it current.
- **Gmail integration** — OAuth sign-in, reads unread mail, reply directly from the dashboard (replied mail is removed instantly).
- **Live weather** — real conditions from OpenWeatherMap at your location (GPS with IP fallback). Animated background responds to both condition (clear/cloud/rain/snow/storm/fog × time-of-day) and a continuous temperature-driven color wash.
- **Live news ticker** — real GNews headlines, scrolling, click for an AI-generated summary. 10-minute cache, refresh every 2 cycles.
- **Persistent session** — login survives refresh; profile picture + name in the header.

## Tech stack

- **Frontend:** React 18 + Vite
- **AI:** Groq API (Llama 3.3 70B) for chat + summaries
- **Automation backend:** n8n (dashboard aggregation, fallbacks)
- **APIs:** Gmail (OAuth), OpenWeatherMap, GNews, ipapi.co (geolocation)

## Setup

```bash
git clone https://github.com/saicharanx/nexusos-ai-dashboard.git
cd nexusos-ai-dashboard
npm install
cp .env.example .env      # then add your own keys (all free tiers)
npm run dev
```

| Variable | Where to get it | Powers |
|---|---|---|
| `VITE_GROQ_API_KEY` | console.groq.com (free) | AI chat + summaries |
| `VITE_GNEWS_API_KEY` | gnews.io (free) | news ticker |
| `VITE_OWM_KEY` | openweathermap.org (free) | weather |
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console | Gmail login |
| `VITE_N8N_WEBHOOK_URL` | your n8n instance | dashboard data |

Restart the dev server after editing `.env`. Without a key, that feature degrades gracefully (e.g. chat shows "AI assistant unavailable") — no hardcoded or fake data anywhere.

## Key decisions

- **Groq-only conversational chatbot** — never keyword-scripted. A small deterministic parser handles explicit "remind me…" commands instantly; every other message goes to the live model.
- **Graceful degradation over fake data** — every integration has a real fallback or an honest "unavailable" state.
- **Frontend-only** — fast to build and deploy; keys supplied via environment variables.

## What I'd improve

- Move secrets server-side (a frontend app necessarily ships keys to the client).
- Richer agent tools — calendar integration, multi-step planning, email triage.
- Offline-first reminders via service workers so alarms fire even if the tab is closed.
- Test coverage for the reminder parser and data-normalization layer.
