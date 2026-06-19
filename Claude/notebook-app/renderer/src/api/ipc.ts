import type {
  Folder,
  Note,
  SearchResult,
  ChatMessage,
  PdfAttachment,
  AIProvider,
  OllamaModel,
} from '../../../shared/types'

declare global {
  interface Window {
    api: {
      notes: {
        list: (folderId?: number) => Promise<Note[]>
        get: (id: number) => Promise<Note | undefined>
        create: (folderId: number | null) => Promise<Note>
        update: (
          id: number,
          patch: Partial<Pick<Note, 'title' | 'content' | 'folder_id'>>
        ) => Promise<Note>
        delete: (id: number) => Promise<void>
      }
      folders: {
        list: () => Promise<Folder[]>
        create: (name: string, parentId: number | null) => Promise<Folder>
        rename: (id: number, name: string) => Promise<Folder>
        delete: (id: number) => Promise<void>
      }
      search: {
        fullText: (query: string) => Promise<SearchResult[]>
      }
      ai: {
        chat: (
          messages: ChatMessage[],
          noteContext: string,
          provider: AIProvider,
          model?: string
        ) => Promise<void>
        listOllamaModels: () => Promise<OllamaModel[]>
        onChunk: (cb: (text: string) => void) => () => void
        onDone: (cb: () => void) => () => void
        onError: (cb: (msg: string) => void) => () => void
      }
      pdf: {
        open: () => Promise<PdfAttachment | null>
      }
      audio: {
        transcribe: (data: ArrayBuffer) => Promise<string>
      }
    }
  }
}

export const api = window.api
