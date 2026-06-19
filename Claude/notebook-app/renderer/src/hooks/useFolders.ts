import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/ipc'
import type { Folder } from '../../../shared/types'

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([])

  const refresh = useCallback(async () => {
    setFolders(await api.folders.list())
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createFolder = useCallback(
    async (name: string, parentId: number | null = null) => {
      await api.folders.create(name, parentId)
      await refresh()
    },
    [refresh]
  )

  const renameFolder = useCallback(
    async (id: number, name: string) => {
      await api.folders.rename(id, name)
      await refresh()
    },
    [refresh]
  )

  const deleteFolder = useCallback(
    async (id: number) => {
      await api.folders.delete(id)
      await refresh()
    },
    [refresh]
  )

  return { folders, createFolder, renameFolder, deleteFolder, refresh }
}
