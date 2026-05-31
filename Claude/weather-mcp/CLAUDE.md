# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

A keyless weather MCP (Model Context Protocol) server built with TypeScript and Node.js. Provides weather data to AI assistants via four tools — no API keys required.

## Stack

- **Runtime**: Node.js (ES modules)
- **Language**: TypeScript (ES2022, Node16 module resolution)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **HTTP client**: `node-fetch`
- **Validation**: `zod`

## Commands

```bash
# Build TypeScript to dist/
npm run build

# Start the MCP server (stdio transport)
npm start
```

## API Keys

**None required.** All three data sources are free and keyless:

| Source | Role | URL |
|--------|------|-----|
| Open-Meteo | Primary current weather + forecast | api.open-meteo.com |
| wttr.in | Fallback for current weather | wttr.in |
| 7Timer | Precipitation + cloud cover specialist | 7timer.info |

## Architecture

```
src/
├── index.ts       — MCP server entry point, four tool handlers
├── router.ts      — Orchestration layer with TTL caches
├── cache.ts       — Generic TTL cache class
└── sources/
    ├── openmeteo.ts  — Geocoding, current weather, forecast, WMO code map
    ├── wttr.ts       — Current weather fallback
    └── seventimer.ts — 48-hour civil forecast (precipitation focus)
```

## Tools

| Tool | Description |
|------|-------------|
| `get_current_weather` | Current conditions for any city |
| `get_forecast` | Up to 16-day daily forecast |
| `compare_sources` | Side-by-side from all three sources |
| `get_precipitation_detail` | Next 24h precipitation + cloud cover from 7Timer |

## Caching

- Geocoding results: 1 hour
- Current weather: 10 minutes
- Forecast: 30 minutes
