import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync } from 'fs'
import { basename } from 'path'
import { IPC } from '../../shared/types'
import type { PdfAttachment } from '../../shared/types'

// pdf-parse has no bundled TS types; require it directly
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer
) => Promise<{ text: string; numpages: number }>

const MAX_PDF_CHARS = 60_000

export function registerPdfHandlers(): void {
  ipcMain.handle(IPC.PDF.OPEN, async (event): Promise<PdfAttachment | null> => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win ?? undefined!, {
      title: 'Select a PDF',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile'],
    })

    if (result.canceled || !result.filePaths[0]) return null

    const filePath = result.filePaths[0]
    const buf = readFileSync(filePath)
    const parsed = await pdfParse(buf)

    const text =
      parsed.text.length > MAX_PDF_CHARS
        ? parsed.text.slice(0, MAX_PDF_CHARS) + '\n[… truncated]'
        : parsed.text

    return {
      name: basename(filePath),
      text,
      pages: parsed.numpages,
    }
  })
}
