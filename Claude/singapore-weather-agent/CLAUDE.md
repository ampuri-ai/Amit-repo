# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Node.js agent that polls the Open-Meteo API on a cron schedule and sends a Gmail alert when Singapore's temperature drops below a configured threshold.

## Commands

```bash
# Install dependencies
npm install

# Run the agent
npm start
```

There are no tests and no build step — `agent.js` runs directly with Node.js.

## Configuration

Copy `.env.example` to `.env` and fill in credentials:

| Variable | Description |
|----------|-------------|
| `EMAIL_USER` | Gmail address used to authenticate SMTP |
| `EMAIL_PASS` | Gmail App Password (not account password) |
| `EMAIL_FROM` | Sender address |
| `EMAIL_TO` | Recipient address |
| `SMTP_HOST` | Optional — defaults to `smtp.gmail.com` |
| `SMTP_PORT` | Optional — defaults to `587` |

## Architecture

Everything lives in `agent.js`. The `CONFIG` object at the top is the single place to change behaviour:

- **`threshold.minTemp`** — temperature (°C) that triggers an alert (default 30)
- **`schedule`** — cron expression for poll frequency (default every 10 minutes)
- **`alertCooldownMinutes`** — minimum gap between repeat alerts for the same condition (default 60)

Flow: `checkWeather` → `fetchTemperature` (Open-Meteo API) → if below threshold and cooldown elapsed → `sendAlert` (nodemailer SMTP). The cooldown is in-memory (`lastAlertSent`), so it resets on process restart.
