import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { ChatMessage, OllamaModel } from '../shared/types'

contextBridge.exposeInMainWorld('api', {
  ollama: {
    listModels: (): Promise<OllamaModel[]> => ipcRenderer.invoke(IPC.OLLAMA.LIST_MODELS),
    chat: (model: string, messages: ChatMessage[]) =>
      ipcRenderer.invoke(IPC.OLLAMA.CHAT, model, messages),
    onChunk: (cb: (text: string) => void) => {
      const fn = (_: Electron.IpcRendererEvent, text: string) => cb(text)
      ipcRenderer.on(IPC.OLLAMA.CHUNK, fn)
      return () => ipcRenderer.removeListener(IPC.OLLAMA.CHUNK, fn)
    },
    onDone: (cb: () => void) => {
      const fn = () => cb()
      ipcRenderer.on(IPC.OLLAMA.DONE, fn)
      return () => ipcRenderer.removeListener(IPC.OLLAMA.DONE, fn)
    },
    onError: (cb: (msg: string) => void) => {
      const fn = (_: Electron.IpcRendererEvent, msg: string) => cb(msg)
      ipcRenderer.on(IPC.OLLAMA.ERROR, fn)
      return () => ipcRenderer.removeListener(IPC.OLLAMA.ERROR, fn)
    },
  },
})
