# mjpin Discord Bot

mjpin is a modular Node.js Discord bot for pinning Midjourney images from Discord messages to Pinterest boards, supporting multiple Pinterest accounts and advanced automation.

## Features
- `/pin` slash command to pin images from Discord to Pinterest boards
- Multi-account Pinterest authentication
- Board selection and management
- Secure admin dashboard (planned)
- Future: OpenAI-powered prompt generation

## Project Structure
- `src/index.js` — Main bot entry point
- `src/commands/` — Discord command handlers
- `src/services/` — Pinterest, OpenAI, and other integrations
- `src/dashboard/` — Admin dashboard (planned)
- `src/utils/` — Utilities and helpers
- `config/` — Config files (if needed)

## Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your Discord and Pinterest credentials.
3. Run the bot:
   ```bash
   node src/index.js
   ```

## Environment Variables
All secrets and API keys are managed via `.env`. Example keys:
- `MJPIN_DISCORD_TOKEN` — Discord bot token
- `MJPIN_PINTEREST_CLIENT_ID` — Pinterest app client ID
- `MJPIN_PINTEREST_CLIENT_SECRET` — Pinterest app client secret

## Admin Dashboard
A secure web dashboard for managing Pinterest accounts and boards will be added soon.

## Contributing
Follow modularity and security best practices. See `/src` for structure.

---
Chris Huber — https://chubes.net
