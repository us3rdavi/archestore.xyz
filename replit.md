# Arche Store Discord Bot

## Overview
Discord bot for store management — tickets, sales cart, slash commands, auto-logs, scheduled reposting, and more.

## Stack
- **Runtime:** Node.js 20
- **Discord library:** discord.js v14
- **Database:** MongoDB (in-memory cache + persistence)
- **Payments:** Mercado Pago, EFI (Gerencianet)

## How to run
```
node index.js
```
The workflow **Start application** handles this automatically.

## Required secrets
| Secret | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `MONGODB_URI` | MongoDB connection string |

## Project structure
- `index.js` — entry point, Discord client setup
- `config.json` — bot ID, owner ID, expiration (tokens go in secrets, not here)
- `Database/` — MongoDB + in-memory cache layer
- `ComandosSlash/` — slash command definitions
- `Eventos/` — event handlers (tickets, logs, config, etc.)
- `Functions/` — shared utility functions
- `Handler/` — slash command & event loader

## User preferences
