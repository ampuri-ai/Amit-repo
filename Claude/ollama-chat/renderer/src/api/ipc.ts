import type { ChatMessage, OllamaModel } from '../../../shared/types'

declare global {
  interface Window {
    api: {
      ollama: {
        listModels: () => Promise<OllamaModel[]>
        chat: (model: string, messages: ChatMessage[]) => Promise<void>
        onChunk: (cb: (text: string) => void) => () => void
        onDone: (cb: () => void) => () => void
        onError: (cb: (msg: string) => void) => () => void
      }
    }
  }
}

export const api = window.api
