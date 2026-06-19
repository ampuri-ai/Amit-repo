import {
  useEffect,
  useRef,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react'
import { api } from '../../api/ipc'
import type { Note, SearchResult } from '../../../../../shared/types'

export interface PaletteCommand {
  id: string
  label: string
  description?: string
  shortcut?: string
  action: () => void
}

type Item =
  | { kind: 'command'; cmd: PaletteCommand }
  | { kind: 'note'; note: Note | SearchResult }

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  commands: PaletteCommand[]
  onSelectNote: (item: { id: number }) => void
}

export function CommandPalette({
  open,
  onClose,
  commands,
  onSelectNote,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState<(Note | SearchResult)[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Reset state and focus on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Load notes on query change
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        if (query.trim()) {
          const results = await api.search.fullText(query)
          if (!cancelled) setNotes(results)
        } else {
          const all = await api.notes.list()
          if (!cancelled) setNotes(all.slice(0, 8))
        }
      } catch {
        if (!cancelled) setNotes([])
      }
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, open])

  // Build flat item list
  const matchedCommands = commands.filter(
    (c) =>
      !query.trim() ||
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const items: Item[] = [
    ...matchedCommands.map((cmd): Item => ({ kind: 'command', cmd })),
    ...notes.map((note): Item => ({ kind: 'note', note })),
  ]

  // Clamp selection when list changes
  useEffect(() => {
    setSelectedIndex((i) => Math.min(i, Math.max(0, items.length - 1)))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  const execute = useCallback(
    (item: Item) => {
      if (item.kind === 'command') {
        item.cmd.action()
      } else {
        onSelectNote({ id: item.note.id })
      }
      onClose()
    },
    [onClose, onSelectNote]
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[selectedIndex]
      if (item) execute(item)
    }
  }

  if (!open) return null

  const showCommandsHeader = matchedCommands.length > 0
  const showNotesHeader = notes.length > 0
  const showNoteDivider = showCommandsHeader && showNotesHeader

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="text-gray-400 shrink-0"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zm-5.242 1.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search notes…"
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
          />
          <kbd className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 font-mono shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && (
            <p className="px-4 py-6 text-sm text-center text-gray-400">No results</p>
          )}

          {items.map((item, i) => {
            const isSelected = i === selectedIndex
            const isFirstNote =
              item.kind === 'note' && i === matchedCommands.length && showNoteDivider

            return (
              <div key={item.kind === 'command' ? item.cmd.id : `note-${item.note.id}`}>
                {/* Section divider for Notes */}
                {isFirstNote && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {query.trim() ? 'Notes' : 'Recent Notes'}
                    </span>
                  </div>
                )}
                {/* Commands section header before first command */}
                {item.kind === 'command' && i === 0 && showCommandsHeader && (
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Commands
                    </span>
                  </div>
                )}

                <button
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-800 hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onMouseDown={(e) => { e.preventDefault(); execute(item) }}
                >
                  {item.kind === 'command' ? (
                    <>
                      <CommandIcon />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">{item.cmd.label}</span>
                        {item.cmd.description && (
                          <span className="block text-xs text-gray-400 truncate">
                            {item.cmd.description}
                          </span>
                        )}
                      </span>
                      {item.cmd.shortcut && (
                        <kbd className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 font-mono shrink-0">
                          {item.cmd.shortcut}
                        </kbd>
                      )}
                    </>
                  ) : (
                    <>
                      <NoteIcon />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {'title' in item.note ? item.note.title : item.note.title}
                        </span>
                        {'snippet' in item.note && item.note.snippet && (
                          <span className="block text-xs text-gray-400 truncate">
                            {item.note.snippet.replace(/<[^>]+>/g, '')}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-400">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

function CommandIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-gray-400 shrink-0"
    >
      <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v2A1.5 1.5 0 0 0 3.5 7h2A1.5 1.5 0 0 0 7 5.5v-2A1.5 1.5 0 0 0 5.5 2h-2zm0 7A1.5 1.5 0 0 0 2 10.5v2A1.5 1.5 0 0 0 3.5 14h2A1.5 1.5 0 0 0 7 12.5v-2A1.5 1.5 0 0 0 5.5 9h-2zm7-7A1.5 1.5 0 0 0 9 3.5v2A1.5 1.5 0 0 0 10.5 7h2A1.5 1.5 0 0 0 14 5.5v-2A1.5 1.5 0 0 0 12.5 2h-2zm0 7A1.5 1.5 0 0 0 9 10.5v2A1.5 1.5 0 0 0 10.5 14h2A1.5 1.5 0 0 0 14 12.5v-2A1.5 1.5 0 0 0 12.5 9h-2z" />
    </svg>
  )
}

function NoteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="text-gray-400 shrink-0"
    >
      <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm4 1v1h4V3H6zm-1 3v1h6V6H5zm0 3v1h6V9H5zm0 3v1h4v-1H5z" />
    </svg>
  )
}
