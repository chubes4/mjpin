# Environment Variables

Required and optional environment variables for bot configuration.

## Required Variables

**Discord configuration:**
- `MJPIN_DISCORD_TOKEN` - Bot authentication token from Discord Developer Portal
- `MJPIN_DISCORD_CLIENT_ID` - Discord application client ID
- `MJPIN_DISCORD_GUILD_ID` - Target Discord server ID for command registration

**Pinterest configuration:**
- `MJPIN_PINTEREST_CLIENT_ID` - Pinterest app client ID
- `MJPIN_PINTEREST_CLIENT_SECRET` - Pinterest app client secret
- `MJPIN_PINTEREST_REDIRECT_URI` - OAuth callback URL (must match Pinterest app configuration)

**OpenAI configuration:**
- `MJPIN_OPENAI_API_KEY` - OpenAI API key for prompt generation

## Optional Variables

**OpenAI fallback:**
- `MJPIN_OPENAI_SYSTEM_PROMPT` - Fallback system prompt if no .txt files in data/

## Discord Configuration Details

**MJPIN_DISCORD_TOKEN:**
- Format: Long alphanumeric string
- Source: Discord Developer Portal → Bot section → Reset Token
- Security: Never commit to version control
- Permissions required: Bot must have appropriate guild permissions

**MJPIN_DISCORD_CLIENT_ID:**
- Format: Numeric string (snowflake ID)
- Source: Discord Developer Portal → General Information → Application ID
- Usage: Command registration, OAuth (future)

**MJPIN_DISCORD_GUILD_ID:**
- Format: Numeric string (snowflake ID)
- Source: Discord server → Right-click server → Copy ID (requires Developer Mode)
- Usage: Guild-specific slash command registration
- Scope: Commands registered only in this guild (not global)

## Pinterest Configuration Details

**MJPIN_PINTEREST_CLIENT_ID:**
- Format: Numeric string
- Source: Pinterest Developer Portal → App settings
- Usage: OAuth2 authorization URL generation

**MJPIN_PINTEREST_CLIENT_SECRET:**
- Format: Alphanumeric string
- Source: Pinterest Developer Portal → App settings
- Security: Never commit to version control
- Usage: OAuth2 token exchange

**MJPIN_PINTEREST_REDIRECT_URI:**
- Format: Full URL (e.g., https://example.com/pinterest/callback)
- Requirements:
  - Must match Pinterest app configuration exactly
  - Must be publicly accessible for OAuth callback
  - Must use HTTPS in production
  - Endpoint must handle OAuth callback (PHP script or Express.js route)
- Usage: OAuth2 redirect after user authorization

## OpenAI Configuration Details

**MJPIN_OPENAI_API_KEY:**
- Format: String starting with "sk-"
- Source: OpenAI Platform → API Keys
- Security: Never commit to version control
- Usage: All OpenAI API requests (model list, chat completions)

**MJPIN_OPENAI_SYSTEM_PROMPT:**
- Format: String (can include newlines)
- Optional: Used only if data/*.txt files not found
- Default: "You are a helpful AI that generates Midjourney prompts."
- Usage: Fallback for `/prompt` command system message

## Configuration File

**Location:** `.env` file in project root

**Format:**
```
MJPIN_DISCORD_TOKEN=your_token_here
MJPIN_DISCORD_CLIENT_ID=your_client_id
MJPIN_DISCORD_GUILD_ID=your_guild_id
MJPIN_PINTEREST_CLIENT_ID=your_pinterest_client_id
MJPIN_PINTEREST_CLIENT_SECRET=your_pinterest_secret
MJPIN_PINTEREST_REDIRECT_URI=https://your-domain.com/pinterest/callback
MJPIN_OPENAI_API_KEY=sk-your_api_key
MJPIN_OPENAI_SYSTEM_PROMPT=Optional fallback prompt text
```

**Loading:**
Loaded via `dotenv` package on bot startup.

**Version control:**
`.env` file must be in `.gitignore`.

## Validation

**Startup validation:**
Bot logs environment variable presence:
- Token presence logged as '[HIDDEN]' for security
- Client ID and Guild ID logged for verification
- Missing required variables cause startup failure

**Runtime validation:**
- Missing Pinterest credentials: Commands return error messages
- Missing OpenAI key: `/prompt` returns error message
- Missing Discord credentials: Bot fails to connect

## Security Best Practices

**Token handling:**
- Never log full tokens
- Never commit tokens to version control
- Rotate tokens if exposed
- Use environment variables, not hardcoded values

**File permissions:**
- `.env` file should have restricted permissions (600)
- Readable only by application user

**Production deployment:**
- Use environment variable management system (not .env file)
- Examples: PM2 ecosystem.config.js, systemd environment files, container secrets

## Deployment Configuration

**Development:**
Use `.env` file with `dotenv` package.

**Production (PM2):**
Configure in `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'mjpin',
    script: './src/index.js',
    env: {
      MJPIN_DISCORD_TOKEN: 'token_here',
      // ... other variables
    }
  }]
};
```

**Production (systemd):**
Configure in service file or environment file.

**Production (Docker):**
Use environment variables in docker-compose.yml or Kubernetes secrets.
