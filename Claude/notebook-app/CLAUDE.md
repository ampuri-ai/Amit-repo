# Notebook App — AI-Powered Desktop Note Tool

## Stack
- Electron (main process) + React + Tailwind CSS (renderer)
- TipTap for rich text editing
- better-sqlite3 for local database (notes, folders, tags, FTS5 full-text search)
- Anthropic Claude API (claude-sonnet-4-6) for AI chat and summaries
- nodejs-whisper for local audio transcription
- pdf-parse for PDF text extraction
- electron-builder for packaging

## Architecture
- `main/` — Electron main process: IPC handlers, SQLite, file system, audio
- `renderer/` — React app: Editor, Sidebar, AIPanel, AudioRecorder components
- `shared/` — shared constants and TypeScript types

## Coding conventions
- TypeScript throughout
- Functional React components with hooks only
- All IPC calls go through a typed bridge in `renderer/src/api/ipc.ts`
- SQLite migrations live in `main/db/migrations/`
- Never expose the Anthropic API key in the renderer process; proxy all AI calls through the main process IPC

## Features to build (in order)
1. Electron + React scaffold with note editor and sidebar
2. SQLite: notes, folders, tags, full-text search
3. AI chat panel with streaming (via main process IPC → Claude API)
4. PDF upload and text extraction for AI context
5. Audio recording + local Whisper transcription
6. Keyboard shortcuts and command palette
