export interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_at: string
}

export interface Note {
  id: number
  title: string
  content: string
  folder_id: number | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
}

export interface SearchResult {
  id: number
  title: string
  snippet: string
  folder_id: number | null
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export type AIProvider = 'ollama' | 'anthropic'

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export interface PdfAttachment {
  name: string
  text: string
  pages: number
}

export const IPC = {
  NOTES: {
    LIST: 'notes:list',
    GET: 'notes:get',
    CREATE: 'notes:create',
    UPDATE: 'notes:update',
    DELETE: 'notes:delete',
  },
  FOLDERS: {
    LIST: 'folders:list',
    CREATE: 'folders:create',
    RENAME: 'folders:rename',
    DELETE: 'folders:delete',
  },
  SEARCH: {
    FULL_TEXT: 'search:fullText',
  },
  AI: {
    CHAT: 'ai:chat',
    CHUNK: 'ai:chunk',
    DONE: 'ai:done',
    ERROR: 'ai:error',
    LIST_OLLAMA_MODELS: 'ai:listOllamaModels',
  },
  PDF: {
    OPEN: 'pdf:open',
  },
  AUDIO: {
    TRANSCRIBE: 'audio:transcribe',
  },
} as const
