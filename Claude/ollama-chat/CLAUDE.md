# Ollama Chat — Local AI Chat Desktop App

## Stack
- Electron (main process) + React + Tailwind CSS (renderer)
- No SDK — talks to Ollama's local REST API (`http://localhost:11434`) via Node's built-in `fetch`
- No API keys, no billing — runs entirely against models pulled via `ollama pull <model>`

## Architecture
- `main/ipc/ollama.ts` — lists local models (`/api/tags`) and streams chat (`/api/chat`, NDJSON) back to the renderer via `webContents.send`
- `preload/index.ts` — typed contextBridge exposing `api.ollama.{listModels, chat, onChunk, onDone, onError}`
- `renderer/` — React chat UI: `ModelPicker` (dropdown of pulled models), `ChatWindow` (message list + input), `useOllamaChat` hook (streaming state)
- `shared/types.ts` — `ChatMessage`, `OllamaModel`, IPC channel constants

## Coding conventions
- TypeScript throughout, functional React components with hooks only
- All IPC calls go through the typed bridge in `renderer/src/api/ipc.ts`
- Streaming pattern: `ipcMain.handle` kicks off an async stream and returns immediately; chunks/done/error arrive as separate IPC events (same pattern as the notebook-app sibling project)

## Prerequisites
- Ollama installed (`winget install Ollama.Ollama` on Windows) and running
- At least one model pulled, e.g. `ollama pull llama3.2`

## Commands
```bash
npm run dev      # electron-vite dev (HMR)
npm run build    # production build to out/
npm run preview  # run the built app
```

## Known machine-specific gotcha
On this Windows machine, the User environment variable `ELECTRON_RUN_AS_NODE=1` forces Electron to run as plain Node (breaks every Electron app's `app`/`BrowserWindow` API). Workaround per-launch:
```powershell
$env:ELECTRON_RUN_AS_NODE = $null; npm run dev
```
