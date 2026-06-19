import { type Editor } from '@tiptap/react'
import type { RecordingState } from '../../hooks/useAudioRecorder'

interface ToolbarProps {
  editor: Editor | null
  recordingState: RecordingState
  onStartRecord: () => void
  onStopRecord: () => void
  disabled?: boolean
}

export function Toolbar({ editor, recordingState, onStartRecord, onStopRecord, disabled }: ToolbarProps) {
  if (!editor) return null

  const btn = (active: boolean) =>
    `px-2 py-1 rounded text-sm font-medium transition-colors select-none ${
      active
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
    }`

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-gray-200 bg-white flex-wrap shrink-0">
      <button
        className={btn(editor.isActive('bold'))}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        className={`${btn(editor.isActive('italic'))} italic`}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }}
        title="Italic (Ctrl+I)"
      >
        I
      </button>
      <button
        className={`${btn(editor.isActive('strike'))} line-through`}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }}
        title="Strikethrough"
      >
        S
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      {([1, 2, 3] as const).map((level) => (
        <button
          key={level}
          className={btn(editor.isActive('heading', { level }))}
          onMouseDown={(e) => {
            e.preventDefault()
            editor.chain().focus().toggleHeading({ level }).run()
          }}
          title={`Heading ${level}`}
        >
          H{level}
        </button>
      ))}

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <button
        className={btn(editor.isActive('bulletList'))}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run() }}
        title="Bullet list"
      >
        • List
      </button>
      <button
        className={btn(editor.isActive('orderedList'))}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run() }}
        title="Ordered list"
      >
        1. List
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      <button
        className={`${btn(editor.isActive('code'))} font-mono`}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCode().run() }}
        title="Inline code"
      >
        {'`code`'}
      </button>
      <button
        className={`${btn(editor.isActive('codeBlock'))} font-mono`}
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleCodeBlock().run() }}
        title="Code block"
      >
        {'```'}
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1 shrink-0" />

      {/* Mic button */}
      {recordingState === 'idle' && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onStartRecord() }}
          disabled={disabled}
          title="Record audio and transcribe"
          className="flex items-center gap-1 px-2 py-1 rounded text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-40 transition-colors select-none"
        >
          <MicIcon />
        </button>
      )}
      {recordingState === 'recording' && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onStopRecord() }}
          title="Stop recording"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors select-none animate-pulse"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Stop
        </button>
      )}
      {recordingState === 'transcribing' && (
        <span className="flex items-center gap-1.5 px-2 py-1 text-sm text-blue-500 select-none">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block animate-pulse" />
          Transcribing…
        </span>
      )}
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V4zm-3 4a4 4 0 0 0 8 0h1a5 5 0 0 1-4.5 4.97V15H8v-1.03A5 5 0 0 1 3.5 9H4z" />
    </svg>
  )
}
