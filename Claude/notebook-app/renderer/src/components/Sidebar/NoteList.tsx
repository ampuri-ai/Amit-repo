import type { Note } from '../../../../shared/types'

interface NoteListProps {
  notes: Note[]
  activeNoteId: number | null
  onSelectNote: (note: Note) => void
  onCreateNote: () => void
  onDeleteNote: (id: number) => void
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NoteList({
  notes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
}: NoteListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</span>
        <button
          onClick={onCreateNote}
          className="text-gray-400 hover:text-blue-600 text-lg leading-none transition-colors"
          title="New note"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-10 px-4">
            No notes yet — press + to create one
          </p>
        )}
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-100 ${
              note.id === activeNoteId
                ? 'bg-blue-50 border-l-2 border-l-blue-400'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {note.title || 'Untitled'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(note.updated_at)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteNote(note.id)
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs shrink-0 mt-0.5 transition-colors"
              title="Delete note"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
