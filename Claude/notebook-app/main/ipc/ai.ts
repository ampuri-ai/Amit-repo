import { ipcMain, BrowserWindow } from 'electron'
import Anthropic from '@anthropic-ai/sdk'
import { IPC } from '../../shared/types'
import type { ChatMessage, AIProvider, OllamaModel } from '../../shared/types'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) client = new Anthropic()
  return client
}

function buildSystemPrompt(noteContext: string): string {
  return noteContext
    ? `You are a helpful assistant embedded in a note-taking app. The user is currently editing a note with the following content:\n\n${noteContext}\n\nAnswer questions and help them based on this context when relevant.`
    : 'You are a helpful assistant embedded in a note-taking app.'
}

async function streamAnthropic(
  win: BrowserWindow,
  messages: ChatMessage[],
  noteContext: string
): Promise<void> {
  const stream = getClient().messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: buildSystemPrompt(noteContext),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  for await (const event of stream) {
    if (win.isDestroyed()) break
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      win.webContents.send(IPC.AI.CHUNK, event.delta.text)
    }
  }
}

async function streamOllama(
  win: BrowserWindow,
  messages: ChatMessage[],
  noteContext: string,
  model: string
): Promise<void> {
  const ollamaMessages = [
    { role: 'system', content: buildSystemPrompt(noteContext) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: ollamaMessages, stream: true }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`Ollama returned ${res.status}. Is Ollama running?`)
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
        win.webContents.send(IPC.AI.CHUNK, parsed.message.content)
      }
    }
  }
}

export function registerAIHandlers(): void {
  ipcMain.handle(
    IPC.AI.CHAT,
    (
      event,
      messages: ChatMessage[],
      noteContext: string,
      provider: AIProvider,
      model?: string
    ) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return

      const task =
        provider === 'ollama'
          ? streamOllama(win, messages, noteContext, model || 'llama3.2')
          : streamAnthropic(win, messages, noteContext)

      task
        .then(() => {
          if (!win.isDestroyed()) win.webContents.send(IPC.AI.DONE)
        })
        .catch((err: Error) => {
          if (!win.isDestroyed()) win.webContents.send(IPC.AI.ERROR, err.message)
        })
    }
  )

  ipcMain.handle(IPC.AI.LIST_OLLAMA_MODELS, async (): Promise<OllamaModel[]> => {
    try {
      const res = await fetch(`${OLLAMA_HOST}/api/tags`)
      if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
      const data = (await res.json()) as { models?: OllamaModel[] }
      return data.models ?? []
    } catch (err) {
      throw new Error(`Could not reach Ollama. Is it running? (${(err as Error).message})`)
    }
  })
}
