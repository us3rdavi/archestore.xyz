# Archestore - Discord Bot

## Overview
A Discord.js v14 bot (in Portuguese) for managing a sales/store system on Discord. Features include:
- Slash commands for administration and users
- Ticket system
- Payment integrations (MercadoPago, EFI/Pix)
- Automated messages and reposting
- Logging (messages, voice, profile)
- Product/cart management
- SQLite and JSON-based data stores

## Project Structure
- `archestore.xyz/` - Main bot directory
  - `index.js` - Entry point
  - `config.json` - Bot owner ID, bot/client ID (token loaded from environment secret)
  - `Handler/` - Loaders for slash commands and events
  - `ComandosSlash/` - Slash command implementations
  - `Eventos/` - Event handlers
  - `Functions/` - Business logic modules
  - `DataBaseJson/` - JSON data stores
  - `Lib/` - Utility libraries

## Setup
- Runtime: Node.js 20
- Package manager: npm (dependencies installed in `archestore.xyz/`)
- Start: `cd archestore.xyz && node index.js`

## Configuration
- `DISCORD_BOT_TOKEN` secret — set in Replit Secrets (required to run the bot)
- Edit `archestore.xyz/config.json` for:
  - `owner` - Discord owner user ID
  - `botid` / `CLIENT_ID` - Discord bot/application ID

## User Preferences
- Keep the existing Portuguese naming conventions
