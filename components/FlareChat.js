'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'

/**
 * FlareChat — a minimal per-iFlare group chat.
 *
 * Design goals:
 *  - Signal, not noise: no reactions/typing/read-receipts.
 *  - Participants only (host + attendees); backend also enforces this.
 *  - Cheap: polls only while this component is mounted (i.e. modal open),
 *    uses ?since=<lastCreatedAt> so each poll returns just deltas.
 *
 * Props:
 *  - flareId   : string
 *  - currentUser : { id, name }
 */
export default function FlareChat({ flareId, currentUser }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const lastCreatedAtRef = useRef(null) // ISO string of most-recent createdAt

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [])

  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/flares/${flareId}/messages?userId=${encodeURIComponent(currentUser.id)}`
      )
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Unable to load chat')
        return
      }
      const data = await res.json()
      const msgs = Array.isArray(data.messages) ? data.messages : []
      setMessages(msgs)
      if (msgs.length > 0) {
        lastCreatedAtRef.current = msgs[msgs.length - 1].createdAt
      }
      setError('')
    } catch (e) {
      setError('Network error')
    } finally {
      setLoadingInitial(false)
      scrollToBottom()
    }
  }, [flareId, currentUser.id, scrollToBottom])

  const fetchDelta = useCallback(async () => {
    if (!lastCreatedAtRef.current) return
    try {
      const since = encodeURIComponent(lastCreatedAtRef.current)
      const res = await fetch(
        `/api/flares/${flareId}/messages?userId=${encodeURIComponent(currentUser.id)}&since=${since}`
      )
      if (!res.ok) return
      const data = await res.json()
      const newer = Array.isArray(data.messages) ? data.messages : []
      if (newer.length === 0) return
      setMessages(prev => {
        const seen = new Set(prev.map(m => m.id))
        const merged = [...prev]
        for (const m of newer) if (!seen.has(m.id)) merged.push(m)
        return merged
      })
      lastCreatedAtRef.current = newer[newer.length - 1].createdAt
      scrollToBottom()
    } catch (e) {
      // silent — next tick will try again
    }
  }, [flareId, currentUser.id, scrollToBottom])

  // Initial load + polling every 6s
  useEffect(() => {
    fetchInitial()
    const interval = setInterval(fetchDelta, 6000)
    return () => clearInterval(interval)
  }, [fetchInitial, fetchDelta])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    if (trimmed.length > 1000) {
      setError('Message is too long (max 1000 characters)')
      return
    }

    setSending(true)
    setError('')

    // Optimistic append
    const tempId = `local-${Date.now()}`
    const optimistic = {
      id: tempId,
      flareId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: trimmed,
      createdAt: new Date().toISOString(),
      _pending: true,
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    scrollToBottom()

    try {
      const res = await fetch(`/api/flares/${flareId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, text: trimmed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Roll back optimistic
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setError(data.error || 'Failed to send')
        setText(trimmed) // Give user their text back
        return
      }
      const saved = data.message
      setMessages(prev => prev.map(m => (m.id === tempId ? saved : m)))
      lastCreatedAtRef.current = saved.createdAt
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setError('Network error')
      setText(trimmed)
    } finally {
      setSending(false)
      scrollToBottom()
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso)
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="mt-6 border-t border-slate-800 pt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200">Chat</h3>
        <span className="text-xs text-slate-500">
          Only for participants of this iFlare
        </span>
      </div>

      {/* Messages list */}
      <div
        ref={listRef}
        className="h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2"
      >
        {loadingInitial ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            No messages yet. Say hi 👋
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUser.id
            return (
              <div
                key={m.id}
                className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    mine
                      ? 'bg-orange-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  } ${m._pending ? 'opacity-70' : ''}`}
                >
                  {!mine && (
                    <div className="text-[11px] font-medium text-slate-300 mb-0.5">
                      {m.senderName}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                  <div
                    className={`text-[10px] mt-1 ${
                      mine ? 'text-orange-100/80' : 'text-slate-500'
                    }`}
                  >
                    {fmtTime(m.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}

      {/* Input */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message the group…"
          maxLength={1000}
          className="flex-1 h-11 px-3 rounded-lg bg-slate-950 border border-slate-800 focus:border-orange-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          aria-label="Send"
          className="h-11 w-11 flex items-center justify-center rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
