import { useState } from 'react'
import { ChatWindow } from './components/Chat/ChatWindow'
import { ModelPicker } from './components/Chat/ModelPicker'
import { useOllamaChat } from './hooks/useOllamaChat'

export default function App() {
  const [model, setModel] = useState('')
  const { messages, streaming, error, sendMessage, clearMessages } = useOllamaChat(model)

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Ollama Chat</span>
          <span className="text-xs text-gray-400">running locally</span>
        </div>
        <div className="flex items-center gap-3">
          <ModelPicker selected={model} onSelect={setModel} />
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <ChatWindow messages={messages} streaming={streaming} error={error} onSend={sendMessage} />
      </main>
    </div>
  )
}
