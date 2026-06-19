import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/ipc'
import type { Note } from '../../../shared/types'

export function useNotes(folderId?: number) {
  const [notes, setNotes] = useState<Note[]>([])

  const refresh = useCallback(async () => {
    setNotes(await api.notes.list(folderId))
  }, [folderId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createNote = useCallback(async () => {
    const note = await api.notes.create(folderId ?? null)
    await refresh()
    return note
  }, [folderId, refresh])

  const deleteNote = useCallback(
    async (id: number) => {
      await api.notes.delete(id)
      await refresh()
    },
    [refresh]
  )

  return { notes, createNote, deleteNote, refresh }
}
