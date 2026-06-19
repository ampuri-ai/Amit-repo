import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import type { ChatMessage } from '../../../../shared/types'

interface ChatWindowProps {
  messages: ChatMessage[]
  streaming: boolean
  error: string | null
  onSend: (text: string) => void
}

function MessageBubble({
  msg,
  isLast,
  streaming,
}: {
  msg: ChatMessage
  isLast: boolean
  streaming: boolean
}) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[75%] rounded-lg px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        }`}
      >
        {msg.content}
        {!isUser && isLast && streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-gray-500 animate-pulse rounded-sm align-middle" />
        )}
      </div>
    </div>
  )
}

export function ChatWindow({ messages, streaming, error, onSend }: ChatWindowProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = () => {
    if (!input.trim() || streaming) return
    onSend(input)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && !error && (
          <p className="text-sm text-gray-400 text-center mt-16 select-none">
            Ask anything — it runs entirely on your machine, no API key needed.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} isLast={i === messages.length - 1} streaming={streaming} />
        ))}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3 mt-2">{error}</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-6 pb-5">
        <div className="flex items-end gap-2 border border-gray-200 rounded-xl bg-gray-50 px-4 py-3 focus-within:border-blue-400 transition-colors">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={streaming}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder-gray-400 max-h-40"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || streaming}
            className="shrink-0 text-blue-600 hover:text-blue-700 disabled:text-gray-300 transition-colors"
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1.5l13 6.5-13 6.5V9.5l9-1.5-9-1.5V1.5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
