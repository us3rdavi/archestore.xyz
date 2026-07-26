# Archestore - Discord Bot

## Overview
A Discord.js v14 bot (in Portuguese) for managing a sales/store system on Discord. Features include:
- Slash commands for administration and users
- Ticket system
- Payment integrations (MercadoPago, EFI/Pix, CentralCart)
- Automated messages and reposting
- Auto-lock channels scheduling
- Logging (messages, voice, profile)
- Product/cart management
- MongoDB-based data store

## Project Structure
- `index.js` — Entry point
- `config.json` — Bot owner ID, bot/client ID, API keys, MongoDB URI
- `Handler/` — Loaders for slash commands and events
- `ComandosSlash/` — Slash command implementations
- `Eventos/` — Event handlers
- `Functions/` — Business logic modules
- `FunctionEmojis/` — Emoji upload/management
- `Database/` — MongoDB adapter (JsonDatabase), QuickStore, emojis.json
- `Lib/` — Utility libraries
- `discloud.config` — DisCloud deployment config
- `upload-emojis.js` — Script to upload emojis to Discord application
- `clear-commands.js` — Script to clear registered slash commands

## Setup
- Runtime: Node.js 20
- Package manager: npm
- Start: `node index.js`

## Configuration
Secrets (set in Replit Secrets — never in code):
- `DISCORD_BOT_TOKEN` — Discord bot token (required)
- `MONGODB_URI` — MongoDB connection string (optional; runs in-memory without it)

Edit `config.json` for:
- `owner` — Discord owner user ID
- `botid` / `CLIENT_ID` — Discord bot/application ID
- Payment/API keys (MercadoPago, EFI, CentralCart)

## User Preferences
- Keep the existing Portuguese naming conventions
- **Nunca usar emojis de teclado/unicode em componentes Discord (ButtonBuilder, etc.)** — sempre usar emojis de upload do bot via `.setEmoji({ id: 'SNOWFLAKE_ID' })`. IDs disponíveis em `Database/emojis.json`. Emojis unicode só são permitidos em conteúdo de texto (TextDisplayBuilder, labels de select menu, strings normais).
