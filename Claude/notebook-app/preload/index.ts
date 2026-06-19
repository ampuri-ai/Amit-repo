import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { ChatMessage, PdfAttachment, AIProvider, OllamaModel } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  notes: {
    list: (folderId?: number) => ipcRenderer.invoke(IPC.NOTES.LIST, folderId),
    get: (id: number) => ipcRenderer.invoke(IPC.NOTES.GET, id),
    create: (folderId: number | null) => ipcRenderer.invoke(IPC.NOTES.CREATE, folderId),
    update: (id: number, patch: object) => ipcRenderer.invoke(IPC.NOTES.UPDATE, id, patch),
    delete: (id: number) => ipcRenderer.invoke(IPC.NOTES.DELETE, id),
  },
  folders: {
    list: () => ipcRenderer.invoke(IPC.FOLDERS.LIST),
    create: (name: string, parentId: number | null) =>
      ipcRenderer.invoke(IPC.FOLDERS.CREATE, name, parentId),
    rename: (id: number, name: string) => ipcRenderer.invoke(IPC.FOLDERS.RENAME, id, name),
    delete: (id: number) => ipcRenderer.invoke(IPC.FOLDERS.DELETE, id),
  },
  search: {
    fullText: (query: string) => ipcRenderer.invoke(IPC.SEARCH.FULL_TEXT, query),
  },
  ai: {
    chat: (messages: ChatMessage[], noteContext: string, provider: AIProvider, model?: string) =>
      ipcRenderer.invoke(IPC.AI.CHAT, messages, noteContext, provider, model),
    listOllamaModels: (): Promise<OllamaModel[]> =>
      ipcRenderer.invoke(IPC.AI.LIST_OLLAMA_MODELS),
    onChunk: (cb: (text: string) => void) => {
      const fn = (_: Electron.IpcRendererEvent, text: string) => cb(text)
      ipcRenderer.on(IPC.AI.CHUNK, fn)
      return () => ipcRenderer.removeListener(IPC.AI.CHUNK, fn)
    },
    onDone: (cb: () => void) => {
      const fn = () => cb()
      ipcRenderer.on(IPC.AI.DONE, fn)
      return () => ipcRenderer.removeListener(IPC.AI.DONE, fn)
    },
    onError: (cb: (msg: string) => void) => {
      const fn = (_: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on(IPC.AI.ERROR, fn)
      return () => ipcRenderer.removeListener(IPC.AI.ERROR, fn)
    },
  },
  pdf: {
    open: (): Promise<PdfAttachment | null> => ipcRenderer.invoke(IPC.PDF.OPEN),
  },
  audio: {
    transcribe: (data: ArrayBuffer): Promise<string> =>
      ipcRenderer.invoke(IPC.AUDIO.TRANSCRIBE, data),
  },
})
