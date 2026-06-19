import { ipcMain } from 'electron'
import { writeFileSync, unlinkSync } from 'fs'
import { createReadStream } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import OpenAI from 'openai'
import { IPC } from '../../shared/types'

let openai: OpenAI | null = null
function getClient(): OpenAI {
  if (!openai) openai = new OpenAI()
  return openai
}

export function registerAudioHandlers(): void {
  ipcMain.handle(IPC.AUDIO.TRANSCRIBE, async (_, data: ArrayBuffer): Promise<string> => {
    const tmpPath = join(tmpdir(), `notebook-audio-${Date.now()}.webm`)
    writeFileSync(tmpPath, Buffer.from(data))

    try {
      const result = await getClient().audio.transcriptions.create({
        file: createReadStream(tmpPath),
        model: 'whisper-1',
      })
      return result.text
    } finally {
      try { unlinkSync(tmpPath) } catch { /* ignore cleanup errors */ }
    }
  })
}
