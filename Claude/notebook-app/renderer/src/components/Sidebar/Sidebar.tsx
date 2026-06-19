import { FolderTree } from './FolderTree'
import { NoteList } from './NoteList'
import { useFolders } from '../../hooks/useFolders'
import { useNotes } from '../../hooks/useNotes'
import type { Note, SearchResult } from '../../../../shared/types'

interface SidebarProps {
  activeNoteId: number | null
  activeFolderId: number | null
  searchQuery: string
  searchResults: SearchResult[]
  onSelectNote: (note: Note) => void
  onSelectFolder: (id: number | null) => void
  onNoteDeleted: (id: number) => void
}

export function Sidebar({
  activeNoteId,
  activeFolderId,
  searchQuery,
  searchResults,
  onSelectNote,
  onSelectFolder,
  onNoteDeleted,
}: SidebarProps) {
  const { folders, createFolder, deleteFolder } = useFolders()
  const { notes, createNote, deleteNote } = useNotes(activeFolderId ?? undefined)

  const handleCreateNote = async () => {
    const note = await createNote()
    onSelectNote(note)
  }

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id)
    onNoteDeleted(id)
  }

  // Cast SearchResult[] to Note[] for display — NoteList only uses id, title, updated_at
  const displayNotes = searchQuery
    ? (searchResults as unknown as Note[])
    : notes

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden select-none">
      <FolderTree
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={createFolder}
        onDeleteFolder={deleteFolder}
      />
      <div className="flex-1 border-t border-gray-200 overflow-hidden flex flex-col min-h-0">
        <NoteList
          notes={displayNotes}
          activeNoteId={activeNoteId}
          onSelectNote={onSelectNote}
          onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      </div>
    </aside>
  )
}
