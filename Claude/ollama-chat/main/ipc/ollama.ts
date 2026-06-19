import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '../../shared/types'
import type { ChatMessage, OllamaModel } from '../../shared/types'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

async function listModels(): Promise<OllamaModel[]> {
  const res = await fetch(`${OLLAMA_HOST}/api/tags`)
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
  const data = (await res.json()) as { models?: OllamaModel[] }
  return data.models ?? []
}

async function streamChat(
  win: BrowserWindow,
  model: string,
  messages: ChatMessage[]
): Promise<void> {
  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Ollama returned ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (win.isDestroyed()) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.trim()) continue
      const parsed = JSON.parse(line) as { message?: { content?: string } }
      if (parsed.message?.content) {
        win.webContents.send(IPC.OLLAMA.CHUNK, parsed.message.content)
      }
    }
  }
}

export function registerOllamaHandlers(): void {
  ipcMain.handle(IPC.OLLAMA.LIST_MODELS, async () => {
    try {
      return await listModels()
    } catch (err) {
      throw new Error(
        `Could not reach Ollama at ${OLLAMA_HOST}. Is it running? (${(err as Error).message})`
      )
    }
  })

  ipcMain.handle(IPC.OLLAMA.CHAT, (event, model: string, messages: ChatMessage[]) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return

    streamChat(win, model, messages)
      .then(() => {
        if (!win.isDestroyed()) win.webContents.send(IPC.OLLAMA.DONE)
      })
      .catch((err: Error) => {
        if (!win.isDestroyed()) win.webContents.send(IPC.OLLAMA.ERROR, err.message)
      })
  })
}
