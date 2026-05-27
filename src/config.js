export const N8N_WEBHOOK_URL    = import.meta.env.VITE_N8N_WEBHOOK_URL    || ''
export const GOOGLE_CLIENT_ID   = import.meta.env.VITE_GOOGLE_CLIENT_ID   || ''
export const OWM_KEY            = import.meta.env.VITE_OWM_KEY            || ''
export const GROQ_API_KEY       = import.meta.env.VITE_GROQ_API_KEY       || ''
export const GNEWS_API_KEY      = import.meta.env.VITE_GNEWS_API_KEY      || ''

export const GMAIL_SCOPE = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

export const STORAGE_KEY = 'nexos_tasks_v2'
export const PROFILE_KEY = 'nexos_profile_v1'
