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
- `DISCORD_BOT_TOKEN` secret — set in Replit Secrets (required to run the bot)
- Edit `config.json` for:
  - `owner` — Discord owner user ID
  - `botid` / `CLIENT_ID` — Discord bot/application ID
  - `MONGODB_URI` — MongoDB connection string
  - `CENTRALCART_API_KEY` — CentralCart API key

## User Preferences
- Keep the existing Portuguese naming conventions
