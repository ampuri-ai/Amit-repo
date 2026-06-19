import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/ipc'
import type { ChatMessage } from '../../../shared/types'

export function useOllamaChat(model: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const removeChunk = api.ollama.onChunk((text) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (!last || last.role !== 'assistant') return prev
        return [...prev.slice(0, -1), { ...last, content: last.content + text }]
      })
    })
    const removeDone = api.ollama.onDone(() => setStreaming(false))
    const removeError = api.ollama.onError((msg) => {
      setError(msg)
      setStreaming(false)
    })
    return () => {
      removeChunk()
      removeDone()
      removeError()
    }
  }, [])

  const sendMessage = useCallback(
    (userText: string) => {
      const trimmed = userText.trim()
      if (!trimmed || streaming || !model) return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      const assistantMsg: ChatMessage = { role: 'assistant', content: '' }

      setMessages((prev) => {
        const next = [...prev, userMsg, assistantMsg]
        api.ollama.chat(model, [...prev, userMsg])
        return next
      })
      setStreaming(true)
      setError(null)
    },
    [streaming, model]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, streaming, error, sendMessage, clearMessages }
}
