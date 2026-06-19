import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { config } from 'dotenv'
import { getDb } from './db'
import { registerNoteHandlers } from './ipc/notes'
import { registerFolderHandlers } from './ipc/folders'
import { registerSearchHandlers } from './ipc/search'
import { registerAIHandlers } from './ipc/ai'
import { registerPdfHandlers } from './ipc/pdf'
import { registerAudioHandlers } from './ipc/audio'

// Load .env from cwd (project root in dev) — silently no-ops if file is absent
config()

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 860,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Open external links in the default browser instead of a new Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}

app.whenReady().then(() => {
  getDb()
  registerNoteHandlers()
  registerFolderHandlers()
  registerSearchHandlers()
  registerAIHandlers()
  registerPdfHandlers()
  registerAudioHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
