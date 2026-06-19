export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export const IPC = {
  OLLAMA: {
    LIST_MODELS: 'ollama:listModels',
    CHAT: 'ollama:chat',
    CHUNK: 'ollama:chunk',
    DONE: 'ollama:done',
    ERROR: 'ollama:error',
  },
} as const
