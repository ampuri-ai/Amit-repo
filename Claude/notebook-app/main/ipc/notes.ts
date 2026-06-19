import { ipcMain } from 'electron'
import { getDb } from '../db'
import { IPC } from '../../shared/types'
import type { Note } from '../../shared/types'

const ALLOWED_UPDATE_FIELDS = new Set(['title', 'content', 'folder_id'])

export function registerNoteHandlers(): void {
  ipcMain.handle(IPC.NOTES.LIST, (_e, folderId?: number) => {
    const db = getDb()
    if (folderId !== undefined) {
      return db.all(
        'SELECT * FROM notes WHERE folder_id = ? ORDER BY updated_at DESC',
        [folderId]
      ) as Note[]
    }
    return db.all('SELECT * FROM notes ORDER BY updated_at DESC') as Note[]
  })

  ipcMain.handle(IPC.NOTES.GET, (_e, id: number) => {
    return getDb().get('SELECT * FROM notes WHERE id = ?', [id]) as Note | undefined
  })

  ipcMain.handle(IPC.NOTES.CREATE, (_e, folderId: number | null) => {
    const db = getDb()
    const { lastInsertRowid } = db.run(
      "INSERT INTO notes (title, content, folder_id) VALUES ('Untitled', '', ?)",
      [folderId ?? null]
    )
    return db.get('SELECT * FROM notes WHERE id = ?', [Number(lastInsertRowid)]) as Note
  })

  ipcMain.handle(
    IPC.NOTES.UPDATE,
    (_e, id: number, patch: Partial<Pick<Note, 'title' | 'content' | 'folder_id'>>) => {
      const db = getDb()
      const safe = Object.fromEntries(
        Object.entries(patch).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
      )
      if (Object.keys(safe).length === 0) {
        return db.get('SELECT * FROM notes WHERE id = ?', [id]) as Note
      }
      const setClauses = Object.keys(safe).map((k) => `${k} = ?`).join(', ')
      const values = [...Object.values(safe), id] as (string | number | null)[]
      db.run(`UPDATE notes SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`, values)
      return db.get('SELECT * FROM notes WHERE id = ?', [id]) as Note
    }
  )

  ipcMain.handle(IPC.NOTES.DELETE, (_e, id: number) => {
    getDb().run('DELETE FROM notes WHERE id = ?', [id])
  })
}
