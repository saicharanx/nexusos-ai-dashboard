# NexusOS — Stabilization Changes

Stabilization pass only. No UI redesign, no architecture rebuild, no new APIs beyond
those specified (GNews). The current React/Vite structure is preserved.

## Build-blocking bugs fixed (the project did not compile before)
- `src/components/TaskPanel.jsx` — function declaration was closed with `});` instead of `}`. Syntax error, build failed.
- `src/components/MailPanel.jsx` — same `});` → `}` error.

Both fixed. `npm run build` now passes.

## 1. Chatbot — Groq only
- `src/services/llm.js` rewritten: **Groq only**. OpenRouter removed entirely. n8n chat fallback removed (n8n stays for dashboard/news/emails).
- No hardcoded keyword replies (there were none — chat was already LLM-driven).
- If `VITE_GROQ_API_KEY` is missing, the assistant replies exactly: `AI assistant unavailable`. No faked responses.
- Groq request has its own 20s AbortController.

## 2. Timeouts — bounded at 20s
- The original code had **no fetch timeout / AbortController anywhere** (verified against the pristine source). The "8s abort" symptom did not exist in this codebase.
- Added `src/utils/fetchWithTimeout.js` (20s AbortController wrapper).
- Applied to the dashboard, weather, GNews, and Groq fetches. Nothing aborts before 20s; nothing hangs indefinitely.

## 3. News — NewsAPI → GNews
- `src/services/gnews.js` added. GNews `top-headlines` (technology / business / science), CORS-enabled so the browser calls it directly.
- 10-minute `localStorage` cache (`nexos_gnews_cache_v1`) to respect the free quota.
- Ticker refreshes after 2 scroll cycles (existing `animationiteration` logic, now GNews-aware).
- Falls back to n8n news if `VITE_GNEWS_API_KEY` is missing, quota is hit, or the request fails — the ticker never goes empty.
- Same ticker UI and summary modal preserved (no redesign).
- Requires `VITE_GNEWS_API_KEY` in `.env` (free key from https://gnews.io).

## 4. Weather — temperature-responsive animated background
- Already had dynamic animated backgrounds (day / night / clear / cloud / rain / snow / storm / fog × time-of-day = 30 scene gradients with smooth transitions and particle effects).
- Added a **continuous temperature wash** over the scene gradient: the exact temperature maps to a hue + intensity, interpolated smoothly (no discrete bands). Cold → icy blue glow from the top; ~20°C → neutral (no tint); warm → amber, hot → orange-red glow from the bottom. So 5°C and 38°C clear afternoons now read very differently.
- Implemented as an additive overlay layer (`mix-blend-mode: screen`, `tempWashPulse` breathing animation). No existing scene gradient or layout was changed.
- Reads from the live OWM `temp` already in state — no new API calls. Degrades cleanly to no wash when temp is unavailable.

## 5. Login / session
- Session restore, Google profile pic, user name, and Logout button already present and working via `src/hooks/useGmail.js` + `localStorage`.
- Note: the header has no clock to remove — the only clock is inside the weather circle.

## 6. Mail panel
- Right column widened (`1.6fr` → `1.9fr`) and `MailPanel` maxWidth raised (420 → 560) to reduce wasted space and slightly expand the unread section.
- Replied mail is removed from the unread list immediately (already wired via `removeEmail`).

## 7. Tasks
- X-only delete (no left checkbox). X opens a confirmation popup: "Did you finish the task?" with **Yes** (delete) / **No** (close).
- Reminder alarm modal: glowing border (`alPulse`), alarm sound, task name, and Finish / Snooze 5m / 10m / 20m buttons.

### Reminder flow (how tasks get added)
- Type a reminder in the AI Agent bar, e.g. "remind me to attend standup at 5 PM" → the task appears in the To-Do panel. When desktop time matches the task time, the alarm popup fires.
- Two paths feed the To-Do panel:
  1. **Groq** (when `VITE_GROQ_API_KEY` is set) — conversational task creation via the `|||TASK|||` marker.
  2. **Local reminder parser** (`src/utils/reminderParser.js`) — a deterministic command parser that runs first, so explicit "remind me to …" commands add tasks even WITHOUT a Groq key. This is a command parser, not a chatbot reply; anything that isn't a reminder command still falls through to Groq. Handles "at 5 PM", "at 14:30", "in 20 minutes", priority keywords (urgent → HIGH, later → LOW), and no-time reminders.

## Setup
```
npm install
# add VITE_GROQ_API_KEY and VITE_GNEWS_API_KEY to .env
npm run dev
```
