import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Editor } from './components/Editor/Editor'
import { AIPanel } from './components/AIPanel/AIPanel'
import { CommandPalette } from './components/CommandPalette/CommandPalette'
import { useAIChat } from './hooks/useAIChat'
import { useCommandPalette } from './hooks/useCommandPalette'
import { api } from './api/ipc'
import type { Note, SearchResult, PdfAttachment, AIProvider, OllamaModel } from '../../shared/types'

function extractText(jsonStr: string): string {
  if (!jsonStr) return ''
  try {
    const walk = (node: Record<string, unknown>): string => {
      if (node.type === 'text') return (node.text as string) ?? ''
      if (!node.content) return ''
      const sep = ['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock'].includes(
        node.type as string
      )
        ? '\n'
        : ''
      return (node.content as Record<string, unknown>[]).map(walk).join('') + sep
    }
    return walk(JSON.parse(jsonStr)).trim()
  } catch {
    return ''
  }
}

export default function App() {
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [aiOpen, setAiOpen] = useState(false)
  const [pdfs, setPdfs] = useState<PdfAttachment[]>([])
  const [sidebarKey, setSidebarKey] = useState(0)
  const [provider, setProvider] = useState<AIProvider>('ollama')
  const [model, setModel] = useState('')
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([])
  const [ollamaModelsError, setOllamaModelsError] = useState<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { open: paletteOpen, openPalette, closePalette } = useCommandPalette()

  useEffect(() => {
    api.ai
      .listOllamaModels()
      .then((list) => {
        setOllamaModels(list)
        setOllamaModelsError(null)
        if (!model && list[0]) setModel(list[0].name)
      })
      .catch((err: Error) => setOllamaModelsError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const noteContext = [
    activeNote ? `Title: ${activeNote.title}\n\n${extractText(activeNote.content)}` : '',
    ...pdfs.map((p) => `--- PDF: ${p.name} (${p.pages} pages) ---\n${p.text}`),
  ]
    .filter(Boolean)
    .join('\n\n')

  const { messages, streaming, error, sendMessage, clearMessages } = useAIChat(
    noteContext,
    provider,
    model
  )

  const refreshSidebar = useCallback(() => setSidebarKey((k) => k + 1), [])

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) {
      setSearchResults([])
      return
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setSearchResults(await api.search.fullText(q))
      } catch {
        setSearchResults([])
      }
    }, 200)
  }, [])

  const handleSelectNote = useCallback(async (item: { id: number }) => {
    const note = await api.notes.get(item.id)
    if (note) setActiveNote(note)
  }, [])

  const handleSelectFolder = useCallback(
    (id: number | null) => {
      setActiveFolderId(id)
      setActiveNote(null)
      setSearchQuery('')
      setSearchResults([])
      refreshSidebar()
    },
    [refreshSidebar]
  )

  const handleNoteDeleted = useCallback(
    (id: number) => {
      if (activeNote?.id === id) setActiveNote(null)
      refreshSidebar()
    },
    [activeNote, refreshSidebar]
  )

  const handleEditorUpdate = useCallback(
    (updated: Note) => {
      setActiveNote(updated)
      refreshSidebar()
    },
    [refreshSidebar]
  )

  const handleNewNote = useCallback(async () => {
    const note = await api.notes.create(activeFolderId)
    setActiveNote(note)
    refreshSidebar()
  }, [activeFolderId, refreshSidebar])

  const handleAttachPdf = useCallback(async () => {
    const attachment = await api.pdf.open()
    if (!attachment) return
    setPdfs((prev) =>
      prev.some((p) => p.name === attachment.name) ? prev : [...prev, attachment]
    )
  }, [])

  const handleRemovePdf = useCallback((name: string) => {
    setPdfs((prev) => prev.filter((p) => p.name !== name))
  }, [])

  const paletteCommands = useMemo(
    () => [
      {
        id: 'new-note',
        label: 'New Note',
        description: 'Create a new note in the current folder',
        action: handleNewNote,
      },
      {
        id: 'toggle-ai',
        label: aiOpen ? 'Close AI Panel' : 'Open AI Panel',
        description: 'Toggle the AI chat sidebar',
        shortcut: undefined,
        action: () => setAiOpen((v) => !v),
      },
      {
        id: 'attach-pdf',
        label: 'Attach PDF',
        description: 'Add a PDF as AI context',
        action: handleAttachPdf,
      },
      {
        id: 'clear-ai',
        label: 'Clear AI Chat',
        description: 'Remove all AI messages',
        action: clearMessages,
      },
      {
        id: 'command-palette',
        label: 'Command Palette',
        description: 'Open this menu',
        shortcut: 'Ctrl+K',
        action: openPalette,
      },
    ],
    [handleNewNote, aiOpen, handleAttachPdf, clearMessages, openPalette]
  )

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      {/* Top search bar */}
      <div
        className="absolute top-0 z-10 bg-white border-b border-gray-200 flex items-center gap-2 px-4"
        style={{ left: 240, right: 0, height: 40 }}
      >
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search notes…"
          className="flex-1 max-w-lg text-sm border border-gray-200 rounded-md px-3 py-1 outline-none focus:border-blue-400 bg-gray-50 transition-colors"
        />

        {/* Command palette trigger */}
        <button
          onClick={openPalette}
          title="Command palette (Ctrl+K)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v2A1.5 1.5 0 0 0 3.5 7h2A1.5 1.5 0 0 0 7 5.5v-2A1.5 1.5 0 0 0 5.5 2h-2zm0 7A1.5 1.5 0 0 0 2 10.5v2A1.5 1.5 0 0 0 3.5 14h2A1.5 1.5 0 0 0 7 12.5v-2A1.5 1.5 0 0 0 5.5 9h-2zm7-7A1.5 1.5 0 0 0 9 3.5v2A1.5 1.5 0 0 0 10.5 7h2A1.5 1.5 0 0 0 14 5.5v-2A1.5 1.5 0 0 0 12.5 2h-2zm0 7A1.5 1.5 0 0 0 9 10.5v2A1.5 1.5 0 0 0 10.5 14h2A1.5 1.5 0 0 0 14 12.5v-2A1.5 1.5 0 0 0 12.5 9h-2z" />
          </svg>
          <kbd className="font-mono">Ctrl+K</kbd>
        </button>

        {/* AI toggle */}
        <button
          onClick={() => setAiOpen((v) => !v)}
          title="Toggle AI chat"
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            aiOpen
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3zm-1 7h2v2H7v-2zm0-6h2v4.5H7V4z" />
          </svg>
          AI
          {pdfs.length > 0 && (
            <span className="bg-orange-500 text-white rounded-full text-[10px] leading-none px-1 py-0.5">
              {pdfs.length}
            </span>
          )}
        </button>
      </div>

      <Sidebar
        key={sidebarKey}
        activeNoteId={activeNote?.id ?? null}
        activeFolderId={activeFolderId}
        searchQuery={searchQuery}
        searchResults={searchResults}
        onSelectNote={handleSelectNote}
        onSelectFolder={handleSelectFolder}
        onNoteDeleted={handleNoteDeleted}
      />

      <main className="flex-1 flex overflow-hidden" style={{ paddingTop: 40 }}>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Editor note={activeNote} onUpdate={handleEditorUpdate} />
        </div>

        {aiOpen && (
          <div className="w-80 shrink-0 flex flex-col overflow-hidden">
            <AIPanel
              messages={messages}
              streaming={streaming}
              error={error}
              pdfs={pdfs}
              provider={provider}
              onProviderChange={setProvider}
              model={model}
              onModelChange={setModel}
              ollamaModels={ollamaModels}
              ollamaModelsError={ollamaModelsError}
              onSend={sendMessage}
              onClear={clearMessages}
              onAttachPdf={handleAttachPdf}
              onRemovePdf={handleRemovePdf}
            />
          </div>
        )}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        commands={paletteCommands}
        onSelectNote={handleSelectNote}
      />
    </div>
  )
}
