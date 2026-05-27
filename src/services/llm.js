import { GROQ_API_KEY } from '../config'

/** Sentinel returned when no Groq key is configured. */
export const LLM_UNAVAILABLE = '__LLM_UNAVAILABLE__'

/** Call the chatbot LLM. Groq ONLY — no OpenRouter, no n8n chat fallback.
 *  Returns the assistant reply string.
 *  Returns LLM_UNAVAILABLE if the Groq key is missing.
 *  Returns null if Groq is configured but the request fails.
 */
export async function callLLM(messages, systemPrompt, maxTokens = 600) {
  // No key → assistant unavailable. Never fake a response, never fall back.
  if (!GROQ_API_KEY) {
    console.warn('[LLM] Groq key missing — assistant unavailable')
    return LLM_UNAVAILABLE
  }

  const fullMsgs = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  try {
    // Groq is fast, but allow up to 20s before giving up.
    const ctrl  = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 20000)

    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: fullMsgs,
        max_tokens: maxTokens,
        temperature: 0.72,
      }),
      signal: ctrl.signal,
    })
    clearTimeout(timer)

    if (r.ok) {
      const d   = await r.json()
      const txt = d.choices?.[0]?.message?.content
      if (txt) { console.log('[LLM] Groq'); return txt.trim() }
      console.warn('[LLM] Groq returned empty content')
      return null
    }

    const err = await r.json().catch(() => ({}))
    console.warn('[LLM] Groq', r.status, err?.error?.message)
    return null
  } catch (e) {
    console.warn('[LLM] Groq', e.name === 'AbortError' ? 'timed out (20s)' : e.message)
    return null
  }
}
