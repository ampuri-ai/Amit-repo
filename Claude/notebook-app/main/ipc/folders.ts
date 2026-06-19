import { ipcMain } from 'electron'
import { getDb } from '../db'
import { IPC } from '../../shared/types'
import type { Folder } from '../../shared/types'

export function registerFolderHandlers(): void {
  ipcMain.handle(IPC.FOLDERS.LIST, () => {
    return getDb().all('SELECT * FROM folders ORDER BY name ASC') as Folder[]
  })

  ipcMain.handle(IPC.FOLDERS.CREATE, (_e, name: string, parentId: number | null) => {
    const db = getDb()
    const { lastInsertRowid } = db.run(
      'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
      [name.trim(), parentId ?? null]
    )
    return db.get('SELECT * FROM folders WHERE id = ?', [Number(lastInsertRowid)]) as Folder
  })

  ipcMain.handle(IPC.FOLDERS.RENAME, (_e, id: number, name: string) => {
    const db = getDb()
    db.run('UPDATE folders SET name = ? WHERE id = ?', [name.trim(), id])
    return db.get('SELECT * FROM folders WHERE id = ?', [id]) as Folder
  })

  ipcMain.handle(IPC.FOLDERS.DELETE, (_e, id: number) => {
    getDb().run('DELETE FROM folders WHERE id = ?', [id])
  })
}
