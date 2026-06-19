import { useState } from 'react'
import type { Folder } from '../../../../shared/types'

interface FolderTreeProps {
  folders: Folder[]
  activeFolderId: number | null
  onSelectFolder: (id: number | null) => void
  onCreateFolder: (name: string, parentId: number | null) => void
  onDeleteFolder: (id: number) => void
}

export function FolderTree({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const commit = () => {
    const name = newName.trim()
    if (name) onCreateFolder(name, null)
    setNewName('')
    setAdding(false)
  }

  const folderRow = (id: number | null, label: string, icon: string) => (
    <div
      onClick={() => onSelectFolder(id)}
      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm rounded-sm mx-1 ${
        activeFolderId === id
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
    </div>
  )

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Folders
        </span>
        <button
          onClick={() => setAdding(true)}
          className="text-gray-400 hover:text-blue-600 text-lg leading-none transition-colors"
          title="New folder"
        >
          +
        </button>
      </div>

      {folderRow(null, 'All Notes', '📋')}

      {folders.map((f) => (
        <div
          key={f.id}
          className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm rounded-sm mx-1 ${
            activeFolderId === f.id
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onSelectFolder(f.id)}
        >
          <span className="shrink-0">📁</span>
          <span className="flex-1 truncate">{f.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteFolder(f.id)
            }}
            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 text-xs shrink-0 transition-colors"
            title="Delete folder"
          >
            ✕
          </button>
        </div>
      ))}

      {adding && (
        <div className="px-3 py-1">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              if (e.key === 'Escape') { setAdding(false); setNewName('') }
            }}
            onBlur={commit}
            placeholder="Folder name"
            className="w-full text-sm border border-blue-300 rounded px-2 py-1 outline-none bg-white"
          />
        </div>
      )}
    </div>
  )
}
