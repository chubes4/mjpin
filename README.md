# mjpin Discord Bot

mjpin is a modular Node.js Discord bot designed to automate pinning Midjourney-generated images from Discord messages to your Pinterest boards. It supports multiple Pinterest accounts and includes features for workflow automation.

## Features
- **/pin**: Pin up to 10 images from Discord messages to a specified Pinterest board.
- **/auth**: Authenticate your Pinterest account with the bot using a secure OAuth2 flow.
- **/sync**: (Admin-only) Sync your Pinterest boards to make them available for pinning.
- **/prompt**: Generate a Midjourney prompt using OpenAI.
- **Pin Rate Limiting**: Prevents API spam by limiting pins to 100 per 24-hour period per Pinterest account.
- **Multi-Account Support**: Authenticate and use multiple Pinterest accounts.

## Project Structure
- `src/index.js`: The main entry point for the bot.
- `src/commands/`: Contains all the slash command handlers.
- `src/services/`: Houses integration logic for third-party APIs like Pinterest and OpenAI.
- `src/utils/`: Includes utility functions, such as the pin rate limiter.

## Setup
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd mjpin
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure environment variables:**
    Copy the `.env.example` file to `.env` and fill in the required API keys and tokens.
    ```bash
    cp .env.example .env
    ```
4.  **Run the bot:**
    For development, you can run the bot directly:
    ```bash
    node src/index.js
    ```
    For production, it's recommended to use a process manager like `pm2` to keep the bot online:
    ```bash
    pm2 start src/index.js --name mjpin
    ```

## Environment Variables
All secrets and API keys are managed via the `.env` file.

- `MJPIN_DISCORD_TOKEN`: Your Discord bot token.
- `MJPIN_DISCORD_CLIENT_ID`: Your Discord application's client ID.
- `MJPIN_PINTEREST_CLIENT_ID`: Your Pinterest application's client ID.
- `MJPIN_PINTEREST_CLIENT_SECRET`: Your Pinterest application's client secret.
- `MJPIN_PINTEREST_REDIRECT_URI`: The OAuth redirect URI for your Pinterest app (e.g., `http://your-server-ip:3000/pinterest/callback`).
- `MJPIN_OPENAI_API_KEY`: Your OpenAI API key.
- `MJPIN_GUILD_ID`: The Discord server (guild) ID where you will register the slash commands.
- `MJPIN_ADMIN_USER_ID`: The Discord user ID of the bot administrator.
- `MJPIN_LOG_CHANNEL_ID`: (Optional) A Discord channel ID for logging errors and important events.

## Contributing
Contributions are welcome. Please adhere to the existing code structure and principles of modularity and security.

---
Chris Huber — https://chubes.net
