# mjpin Discord Bot

mjpin is a modular Node.js Discord bot designed to automate pinning Midjourney-generated images from Discord messages to your Pinterest boards. It supports multiple Pinterest accounts and includes features for workflow automation.

## Features
- **/pin**: Pin up to 10 images from Discord messages to a specified Pinterest board.
- **/auth**: Authenticate your Pinterest account with the bot using a secure OAuth2 flow.
- **/sync**: (Admin-only) Sync your Pinterest boards to make them available for pinning.
- **/prompt**: Generate a Midjourney prompt using OpenAI.
- **/editprompt**: (Admin-only) Edit the system prompt files used for prompt generation. Supports modular editing of individual prompt sections.
- **Pin Rate Limiting**: Prevents API spam by limiting pins to 100 per 12-hour period per Pinterest account.
- **Multi-Account Support**: Authenticate and use multiple Pinterest accounts.

## Project Structure
- `src/index.js`: The main entry point for the bot.
- `src/commands/`: Contains all the slash command handlers.
- `src/services/`: Houses integration logic for third-party APIs like Pinterest and OpenAI.
- `src/utils/`: Includes utility functions, such as the pin rate limiter.
- `data/`: Contains modular prompt files used for generating Midjourney prompts. Any `.txt` file in this directory will be automatically included in the system prompt.

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
   - Include the provided prompt `.txt` files (or use your own). See `data/README.md` for how prompts are assembled and how to keep private prompts out of git while still being loaded by the bot.
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
- `MJPIN_PINTEREST_REDIRECT_URI`: The OAuth redirect URI for your Pinterest app (e.g., `https://your-domain.com/src/services/pinterest-auth.php` or another callback endpoint you host that runs `src/services/pinterest-auth.php`).
- `MJPIN_OPENAI_API_KEY`: Your OpenAI API key.
- Optional: `MJPIN_OPENAI_MODEL` (defaults to `gpt-3.5-turbo`).
- Optional: `MJPIN_OPENAI_SYSTEM_PROMPT` (used as fallback if no `.txt` prompt files can be read from `data/`).

## Data Directory
See `data/README.md` for complete details on:
- How all top-level `.txt` files in `data/` are concatenated to form the system prompt
- File ordering via numeric prefixes (e.g., `00_`, `10_`, ...)
- Keeping private prompt files out of git while still loaded (e.g., `*.private.txt`, `*.local.txt`)
- Runtime JSON files created by the bot that should not be committed

## Plain-English Overview (What You'll Do)
- You’ll use `/prompt` to generate Midjourney-compatible prompts in Discord.
- You’ll paste those prompts into the Midjourney bot in the same server to generate images.
- When you like the images, you’ll upscale them, and then copy their Discord message IDs and run `/pin` to send them to a Pinterest board with your destination URL.

## Quick How-To (Step-by-Step)
1. **Have both bots in the same Discord server**
   - Add the Midjourney bot to your server (per Midjourney’s instructions).
   - Add your mjpin bot to the same server, with scopes `bot` and `applications.commands` and permissions to read/send messages.
2. **Start mjpin and register commands**
   - Run the bot (`npm start` or pm2). The bot will register its slash commands in your guild automatically on startup.
3. **Connect Pinterest**
   - In Discord, run `/auth` and click the link to authorize. After approval, the callback stores your tokens.
4. **Sync your boards**
   - Run `/sync` to pull your Pinterest boards into the bot.
5. **Generate prompts**
   - Run `/prompt` with your idea. Copy the returned prompts.
6. **Create images in Midjourney**
   - Paste a prompt into the Midjourney bot in the same server/channel and generate images.
7. **Get the Discord message ID(s)**
   - In Discord, enable Developer Mode: User Settings → Advanced → Developer Mode.
   - Right‑click the Midjourney image message → Copy Message ID.
8. **Pin the images**
   - Run `/pin` and provide:
     - `board`: The exact Pinterest board name.
     - `url`: The destination URL for the pin.
     - `message_id_1..10`: The message IDs you copied.
9. **Manage accounts (optional)**
   - Use `/settings` to view or switch the active Pinterest account.

## OAuth Flow (Pinterest)
1. Run `/auth` in Discord. The bot replies with an authorization URL.
2. Authorize the app. Pinterest redirects to your `MJPIN_PINTEREST_REDIRECT_URI`.
3. The provided `src/services/pinterest-auth.php` can be deployed and used as the callback endpoint to complete the token exchange and store credentials in `data/pinterest_tokens.json`.
4. Run `/sync` to fetch your Pinterest boards for the authenticated account.
5. Use `/settings` to view/switch the active Pinterest account.

## Usage
- **/prompt**: Generate a Midjourney prompt using your configured system prompt.
- **/pin**: Provide a board name, one or more `message_id_*`, and a destination `url` to pin images.
- **/editprompt**: Admin-only; edit any `.txt` in `data/` through a modal UI.
- **Rate limit**: 100 pins per 12-hour sliding window per Pinterest account.

## Contributing
Contributions are welcome. Please adhere to the existing code structure and principles of modularity and security.

---
Chris Huber — https://chubes.net
