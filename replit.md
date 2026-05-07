# Vendas Academy Designers - Discord Bot

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
- `Vendas Academy Designers/` - Main bot directory
  - `index.js` - Entry point
  - `config.json` - Bot token, owner ID, bot/client ID
  - `Handler/` - Loaders for slash commands and events
  - `ComandosSlash/` - Slash command implementations
  - `Eventos/` - Event handlers
  - `Functions/` - Business logic modules
  - `DataBaseJson/` - JSON data stores
  - `Lib/` - Utility libraries

## Setup
- Runtime: Node.js 20
- Package manager: npm
- Start: `cd 'Vendas Academy Designers' && node index.js`

## Configuration
Edit `Vendas Academy Designers/config.json` with:
- `token` - Discord bot token
- `owner` - Discord owner user ID
- `botid` / `CLIENT_ID` - Discord bot/application ID

## User Preferences
- Keep the existing Portuguese naming conventions
