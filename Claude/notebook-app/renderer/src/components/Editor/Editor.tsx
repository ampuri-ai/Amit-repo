import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Toolbar } from './Toolbar'
import { useAudioRecorder } from '../../hooks/useAudioRecorder'
import { api } from '../../api/ipc'
import type { Note } from '../../../../shared/types'

interface EditorProps {
  note: Note | null
  onUpdate: (note: Note) => void
}

const SAVE_DEBOUNCE_MS = 500

export function Editor({ note, onUpdate }: EditorProps) {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeNoteId = useRef<number | null>(null)

  const scheduleSave = useCallback(
    (id: number, patch: Partial<Pick<Note, 'title' | 'content'>>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        const updated = await api.notes.update(id, patch)
        onUpdate(updated)
      }, SAVE_DEBOUNCE_MS)
    },
    [onUpdate]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-6 min-h-full focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      if (activeNoteId.current === null) return
      scheduleSave(activeNoteId.current, { content: JSON.stringify(editor.getJSON()) })
    },
  })

  const handleTranscript = useCallback(
    (text: string) => {
      if (!editor || activeNoteId.current === null) return
      editor.chain().focus().insertContent(text + ' ').run()
    },
    [editor]
  )

  const { state: recordingState, error: recordingError, start, stop } = useAudioRecorder(handleTranscript)

  useEffect(() => {
    if (!editor || !note) return
    activeNoteId.current = note.id

    const parsed = (() => {
      try {
        return note.content ? JSON.parse(note.content) : null
      } catch {
        return null
      }
    })()

    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(parsed)) {
      editor.commands.setContent(parsed ?? '')
    }
  }, [editor, note])

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!note) return
      scheduleSave(note.id, { title: e.target.value })
    },
    [note, scheduleSave]
  )

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 select-none">
        Select a note or press + to create one
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <Toolbar
        editor={editor}
        recordingState={recordingState}
        onStartRecord={start}
        onStopRecord={stop}
        disabled={!note}
      />
      {recordingError && (
        <div className="px-4 py-1.5 text-xs text-red-600 bg-red-50 border-b border-red-100">
          {recordingError}
        </div>
      )}
      <div className="px-6 pt-5 pb-1 shrink-0">
        <input
          key={note.id}
          defaultValue={note.title}
          onChange={handleTitleChange}
          placeholder="Untitled"
          className="w-full text-2xl font-bold text-gray-900 border-none outline-none bg-transparent placeholder-gray-300"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  )
}
