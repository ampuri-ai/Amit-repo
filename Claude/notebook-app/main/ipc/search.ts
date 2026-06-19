import { ipcMain } from 'electron'
import { getDb } from '../db'
import { IPC } from '../../shared/types'
import type { SearchResult } from '../../shared/types'

export function registerSearchHandlers(): void {
  ipcMain.handle(IPC.SEARCH.FULL_TEXT, (_e, query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return []

    const ftsQuery = trimmed
      .split(/\s+/)
      .map((w) => `"${w.replace(/"/g, '""')}"*`)
      .join(' ')

    return getDb().all(
      `SELECT n.id, n.title, n.folder_id, n.updated_at,
         snippet(notes_fts, 1, '<mark>', '</mark>', '…', 24) AS snippet
       FROM notes_fts
       JOIN notes n ON notes_fts.rowid = n.id
       WHERE notes_fts MATCH ?
       ORDER BY rank
       LIMIT 50`,
      [ftsQuery]
    ) as SearchResult[]
  })
}
