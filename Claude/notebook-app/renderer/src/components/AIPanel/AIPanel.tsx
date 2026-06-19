import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import type { ChatMessage, PdfAttachment, AIProvider, OllamaModel } from '../../../../../shared/types'

interface AIPanelProps {
  messages: ChatMessage[]
  streaming: boolean
  error: string | null
  pdfs: PdfAttachment[]
  provider: AIProvider
  onProviderChange: (provider: AIProvider) => void
  model: string
  onModelChange: (model: string) => void
  ollamaModels: OllamaModel[]
  ollamaModelsError: string | null
  onSend: (text: string) => void
  onClear: () => void
  onAttachPdf: () => void
  onRemovePdf: (name: string) => void
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
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
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

export function AIPanel({
  messages,
  streaming,
  error,
  pdfs,
  provider,
  onProviderChange,
  model,
  onModelChange,
  ollamaModels,
  ollamaModelsError,
  onSend,
  onClear,
  onAttachPdf,
  onRemovePdf,
}: AIPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const submit = () => {
    if (!input.trim() || streaming) return
    onSend(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            AI Chat
          </span>
          {streaming && (
            <span className="text-xs text-blue-500 animate-pulse">thinking…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAttachPdf}
            title="Attach a PDF as context"
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5.5L9.5 0H4zm5 1v4h4L9 1zM5 8h6v1H5V8zm0 2h6v1H5v-1zm0 2h4v1H5v-1z" />
            </svg>
            PDF
          </button>
          {messages.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Provider / model row */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 shrink-0">
        <select
          value={provider}
          onChange={(e) => onProviderChange(e.target.value as AIProvider)}
          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-blue-400"
        >
          <option value="ollama">Ollama (local)</option>
          <option value="anthropic">Claude (API)</option>
        </select>

        {provider === 'ollama' &&
          (ollamaModelsError ? (
            <span className="text-xs text-red-500 truncate" title={ollamaModelsError}>
              {ollamaModelsError}
            </span>
          ) : (
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white outline-none focus:border-blue-400 flex-1 min-w-0"
            >
              {ollamaModels.length === 0 && <option value="">No local models found</option>}
              {ollamaModels.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          ))}
      </div>

      {/* PDF chips */}
      {pdfs.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-1.5 shrink-0">
          {pdfs.map((pdf) => (
            <div
              key={pdf.name}
              className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded px-2 py-0.5 text-xs text-orange-800"
              title={`${pdf.pages} page${pdf.pages !== 1 ? 's' : ''}`}
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" className="shrink-0 text-orange-500">
                <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V5.5L9.5 0H4zm5 1v4h4L9 1z" />
              </svg>
              <span className="max-w-[120px] truncate">{pdf.name}</span>
              <span className="text-orange-400 ml-0.5">{pdf.pages}p</span>
              <button
                onClick={() => onRemovePdf(pdf.name)}
                className="ml-0.5 text-orange-400 hover:text-orange-600 leading-none"
                aria-label={`Remove ${pdf.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !error && (
          <p className="text-xs text-gray-400 text-center mt-8 select-none">
            Ask anything about your note
            {pdfs.length > 0 && ' or attached PDFs'}.
            <br />
            Press <kbd className="bg-gray-100 rounded px-1">PDF</kbd> above to add context.
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            isLast={i === messages.length - 1}
            streaming={streaming}
          />
        ))}
        {error && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mt-2">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-3 pb-3">
        <div className="flex items-end gap-2 border border-gray-200 rounded-lg bg-gray-50 px-3 py-2 focus-within:border-blue-400 transition-colors">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question… (Enter to send)"
            disabled={streaming}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder-gray-400 max-h-32"
            style={{ overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden' }}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || streaming}
            className="shrink-0 text-blue-600 hover:text-blue-700 disabled:text-gray-300 transition-colors"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1.5l13 6.5-13 6.5V9.5l9-1.5-9-1.5V1.5z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 pl-1">Shift+Enter for newline</p>
      </div>
    </div>
  )
}
