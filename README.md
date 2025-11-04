# mjpin Discord Bot

mjpin is a modular Node.js Discord bot designed to automate pinning Midjourney-generated images from Discord messages to your Pinterest boards. It supports multiple Pinterest accounts and includes features for workflow automation.

> Note: This repository does not include prompt `.txt` files. Create your own in `data/` following `data/README.md`.

## Features
- **/pin**: Search channel history for keyword-matching images and automatically pin up to 10 found images to Pinterest boards. Optionally specify a different board name.
- **/auth**: Authenticate your Pinterest account with the bot using a secure OAuth2 flow.
- **/sync**: Sync your Pinterest boards to make them available for pinning.
- **/prompt**: Generate a Midjourney prompt using OpenAI with per-guild model selection.
- **/model**: (Requires Manage Server) Choose the OpenAI model for the server from available chat-capable models.
- **/editprompt**: (Requires Administrator) Edit the system prompt files used for prompt generation. Supports modular editing of individual prompt sections.
- **/settings**: View and manage active Pinterest account and pin count status.
- **/restart**: (Requires Administrator) Restart the bot process (requires PM2 deployment).
- **Pin Rate Limiting**: Prevents API spam by limiting pins to 100 per 12-hour period per Pinterest account.
- **Multi-Account Support**: Authenticate and use multiple Pinterest accounts.

## Project Structure
- `src/index.js`: The main entry point for the bot with centralized command registration and interaction handling.
- `src/commands/`: Contains all the slash command handlers (pin, prompt, model, auth, sync, settings, editprompt, restart).
- `src/services/`: Houses integration logic for third-party APIs (pinterest.js, openai.js, modelSettings.js, pinterest-auth.php).
- `src/utils/`: Includes utility functions (jsonFileManager.js, pinRateLimit.js, messageSearch.js).
- `data/`: Contains user-created modular prompt `.txt` files. Any `.txt` file in this directory will be automatically included in the system prompt.

## Getting Started
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd mjpin
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy the example file and fill in your values:
     ```bash
     cp .env.example .env
     ```
   - See the Environment Variables section below for details.
4. **Prepare the data directory:**
   - Ensure a `data/` directory exists at the project root.
   - Create your prompt chunk `.txt` files. See `data/README.md` for how prompts are assembled and how to keep private prompts out of git while still being loaded by the bot.
5. **Run the bot:**
   - Development:
     ```bash
     npm start
     ```
   - Production with pm2:
     ```bash
     pm2 start src/index.js --name mjpin
     ```

## Environment Variables
All secrets and API keys are managed via the `.env` file.

- `MJPIN_DISCORD_TOKEN`: Your Discord bot token.
- `MJPIN_DISCORD_CLIENT_ID`: Your Discord application's client ID.
- `MJPIN_DISCORD_GUILD_ID`: The Discord server (guild) ID where you will register the slash commands.
- `MJPIN_PINTEREST_CLIENT_ID`: Your Pinterest application's client ID.
- `MJPIN_PINTEREST_CLIENT_SECRET`: Your Pinterest application's client secret.
- `MJPIN_PINTEREST_REDIRECT_URI`: The OAuth redirect URI for your Pinterest app (e.g., `https://your-domain.com/pinterest/callback`). OAuth callback handled by `src/services/pinterest-auth.php`.
- `MJPIN_OPENAI_API_KEY`: Your OpenAI API key.
- Optional: `MJPIN_OPENAI_SYSTEM_PROMPT` (used as fallback if no `.txt` prompt files can be read from `data/`).

**Note:** OpenAI model selection is managed per-guild using the `/model` command. Each Discord server configures its preferred chat-capable model independently.

## Data Directory
See `data/README.md` for complete details on:
- How all top-level `.txt` files in `data/` are concatenated to form the system prompt
- File ordering via numeric prefixes (e.g., `00_`, `10_`, ...)
- Keeping private prompt files out of git while still loaded (e.g., `*.private.txt`, `*.local.txt`)
- Runtime JSON files created by the bot that should not be committed

## Quick Start Guide
1. **Have both bots in the same Discord server**
   - Add the Midjourney bot to your server (per Midjourney's instructions).
   - Add your mjpin bot to the same server, with scopes `bot` and `applications.commands` and permissions to read/send messages.
2. **Start mjpin and register commands**
   - Run the bot (`npm start` or pm2). The bot will register its slash commands in your guild automatically on startup.
3. **Configure OpenAI model (Admin-only)**
   - Run `/model` to select the OpenAI model for your server from available chat-capable models. This is required before using `/prompt`.
4. **Connect Pinterest**
   - In Discord, run `/auth` and click the link to authorize. After approval, the OAuth callback endpoint stores your tokens.
5. **Sync your boards**
   - Run `/sync` to pull your Pinterest boards into the bot.
6. **Generate prompts**
   - Run `/prompt` with your idea. Copy the returned prompts.
7. **Create images in Midjourney**
   - Paste a prompt into the Midjourney bot in the same server/channel and generate images.
 8. **Pin the images**
     - Run `/pin` with:
       - `keyword`: The search term for finding images (also used as board name).
       - `url`: The destination URL for the pins.
       - `board`: (Optional) Specific board name to pin to (defaults to keyword).
    - The bot automatically searches for matching images after your last `/pin` command and pins them.
10. **Manage accounts (optional)**
    - Use `/settings` to view or switch the active Pinterest account.

## OAuth Flow (Pinterest)
1. Run `/auth` in Discord. The bot replies with an authorization URL.
2. Authorize the app. Pinterest redirects to your `MJPIN_PINTEREST_REDIRECT_URI`.
3. The OAuth callback endpoint handles authorization code exchange and stores credentials in `data/pinterest_tokens.json`.
4. Run `/sync` to fetch your Pinterest boards for the authenticated account.
5. Use `/settings` to view/switch the active Pinterest account if you have multiple accounts.

## Contributing
Contributions are welcome. Please adhere to the existing code structure and principles of modularity and security.

---
Chris Huber — https://chubes.net
