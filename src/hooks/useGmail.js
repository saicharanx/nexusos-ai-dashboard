import { useState, useEffect } from 'react'
import { GOOGLE_CLIENT_ID, GMAIL_SCOPE, PROFILE_KEY } from '../config'
import { fetchGmailUnread } from '../services/gmail'

export function useGmail() {
  const [gToken,       setGToken]       = useState(null)
  const [userProfile,  setUserProfile]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
  })
  const [emails,       setEmails]       = useState(null)
  const [loading,      setLoading]      = useState(false)

  // Restore session on mount
  useEffect(() => {
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
    })()
    if (!saved?.token) return
    setGToken(saved.token)
    setLoading(true)
    fetchGmailUnread(saved.token)
      .then((m) => { setEmails(m); setLoading(false) })
      .catch(() => {
        // Token expired — clear saved session
        localStorage.removeItem(PROFILE_KEY)
        setUserProfile(null); setGToken(null); setLoading(false)
      })
  }, []) // eslint-disable-line

  // Handle OAuth redirect hash
  useEffect(() => {
    if (!location.hash) return
    const p   = new URLSearchParams(location.hash.substring(1))
    const tok = p.get('access_token')
    if (!tok) return
    setGToken(tok)
    history.replaceState(null, '', location.pathname)
    setLoading(true)
    fetchGmailUnread(tok)
      .then((m) => { setEmails(m); setLoading(false) })
      .catch((e) => { console.warn('[Gmail]', e.message); setLoading(false) })
    // Fetch and persist profile
    fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: 'Bearer ' + tok } })
      .then((r) => r.json())
      .then((u) => {
        if (u.name || u.email) {
          const prof = { name: u.name || u.email, email: u.email || '', picture: u.picture || null, token: tok }
          setUserProfile(prof)
          localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line

  const signIn = () => {
    const url = 'https://accounts.google.com/o/oauth2/v2/auth'
      + '?client_id='    + encodeURIComponent(GOOGLE_CLIENT_ID)
      + '&redirect_uri=' + encodeURIComponent(location.origin + location.pathname)
      + '&response_type=token'
      + '&scope='        + encodeURIComponent(GMAIL_SCOPE)
      + '&prompt=select_account&include_granted_scopes=true'
    location.href = url
  }

  const logout = () => {
    localStorage.removeItem(PROFILE_KEY)
    setUserProfile(null); setGToken(null); setEmails(null)
  }

  const removeEmail = (id) => setEmails((prev) => (prev || []).filter((e) => e.id !== id))

  return { gToken, setGToken, userProfile, emails, setEmails, removeEmail, loading, signIn, logout }
}
