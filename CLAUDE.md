# CLAUDE.md

This file provides guidance to Claude Code when working with the mjpin Discord bot codebase.

## Project Overview

mjpin is a modular Node.js Discord bot that automates pinning Midjourney-generated images from Discord messages to Pinterest boards. It features multi-account Pinterest integration, OpenAI-powered prompt generation, and comprehensive workflow automation.

## Architecture Patterns

### Modular Command Structure
- **Command Registration**: All commands auto-register via `src/index.js` with centralized error handling
- **Slash Command Pattern**: Each command in `src/commands/` exports `data` (SlashCommandBuilder) and `execute` function
- **Service Layer Separation**: External API integrations isolated in `src/services/` (pinterest.js, openai.js, modelSettings.js)
- **Utility Layer**: Common functionality in `src/utils/` (jsonFileManager.js, pinRateLimit.js, messageSearch.js)

### Data Management Architecture
- **JSON File Storage**: All persistent data stored as JSON files in `data/` directory
- **Per-User Account Management**: Multi-account Pinterest support with account switching
- **Per-Guild Settings**: OpenAI model selection stored per Discord server
- **Modular Prompt System**: System prompts assembled from multiple `.txt` files in `data/`

### Error Handling Patterns
- **Graceful Degradation**: Commands handle missing data with helpful error messages
- **Deferred Replies**: All commands use `interaction.deferReply()` for operations exceeding 3 seconds
- **Comprehensive Logging**: Process-level error handlers for unhandled rejections and exceptions
- **Signal Handling**: Graceful shutdown on SIGTERM/SIGINT with client cleanup

## Core Commands Implementation

### Workflow Commands
- **/pin**: Pin up to 10 images to Pinterest boards using keyword search with destination URL. Automatically searches channel history after last /pin command for matching images and pins them to board matching keyword (or specified board). Rate limited to 100 pins per 12 hours per Pinterest account. Parameters: `keyword` (required), `url` (required), `board` (optional, defaults to keyword).
- **/prompt**: Generate Midjourney prompts using OpenAI with per-guild model selection

### Account Management Commands
- **/auth**: Generate Pinterest OAuth2 authorization URL for account linking
- **/sync**: Fetch and cache Pinterest boards for authenticated account
- **/settings**: View/switch active Pinterest account and check pin count status

### Admin Commands
- **/model**: Select OpenAI model for the server from available chat-capable models (requires Manage Server permission)
- **/editprompt**: Edit system prompt `.txt` files via Discord modals with section selection (requires Administrator permission)
- **/restart**: Restart bot process via PM2 with post-restart message confirmation (requires Administrator permission)

## External Integrations

### Pinterest API v5 Integration
- **OAuth2 Flow**: OAuth callback handler (`src/services/pinterest-auth.php`) handles authorization code exchange. Note: `pinterest.js` also contains an Express.js OAuth route implementation (`registerPinterestAuthRoute`) that provides an alternative callback handler, though it requires an Express server to be initialized.
- **Multi-Account Support**: Multiple Pinterest accounts per Discord user with account switching
- **Board Management**: Cached board data per Pinterest account with sync capability
- **Rate Limiting**: 100 pins per 12-hour sliding window per Pinterest account

### OpenAI API Integration
- **Per-Guild Model Selection**: Each Discord server configures preferred chat model via `/model` command from available chat-capable models
- **Model Filtering**: Automatically excludes embedding, whisper, audio, image, vision, and TTS models
- **Modular Prompt Assembly**: System prompts built from concatenated `.txt` files in `data/` (user-created, not included in repo)
- **Fallback System**: Environment variable fallback when no prompt files available
- **Dynamic Prompt Reloading**: System prompt reloads automatically after `/editprompt` changes

### Discord.js Integration
- **Message Content Access**: Requires MessageContent intent for image URL extraction
- **Interaction Handling**: Centralized handling for slash commands, select menus, and modals
- **Error Recovery**: Robust interaction response handling with multiple fallback strategies

## Data Structure Patterns

### File-Based Persistence
```
data/
├── *.txt                    # System prompt chunks (user-created, auto-loaded, order by numeric prefix)
├── pinterest_tokens.json    # Multi-account Pinterest OAuth tokens per Discord user
├── boards.json             # Cached Pinterest boards per Pinterest account
├── pin_counts.json         # Sliding window rate limit data per Pinterest account
├── model_settings.json     # OpenAI model selection per Discord guild
└── restart_info.json       # Temporary restart state for post-restart message updates
```

### Account Management Schema
- **Discord User → Multiple Pinterest Accounts**: One-to-many relationship
- **Active Account Selection**: Per Discord user active Pinterest account setting
- **Account Isolation**: Rate limits and boards tracked per Pinterest account ID

## Development Environment

### Required Environment Variables
```
MJPIN_DISCORD_TOKEN          # Discord bot token
MJPIN_DISCORD_CLIENT_ID      # Discord application client ID
MJPIN_DISCORD_GUILD_ID       # Discord server ID for command registration
MJPIN_PINTEREST_CLIENT_ID    # Pinterest app client ID
MJPIN_PINTEREST_CLIENT_SECRET # Pinterest app client secret
MJPIN_PINTEREST_REDIRECT_URI # OAuth callback URL
MJPIN_OPENAI_API_KEY         # OpenAI API key
MJPIN_OPENAI_SYSTEM_PROMPT   # Fallback prompt (optional)
```

### Deployment Patterns
- **Development**: `npm start` for local development
- **Production**: PM2 process manager with graceful shutdown handling
- **OAuth Callback**: Requires publicly accessible endpoint for Pinterest authorization (PHP callback handler or Express.js route)

### Build System
- **Production Build Script**: `build.sh` creates optimized production package with `mjpin-production.tar.gz`
- **Build Process**: Excludes development files using `.buildignore`, validates essential files, creates compressed archive
- **File Exclusions**: Excludes `.git/`, `node_modules/`, `data/`, `.env`, `docs/`, `README.md`, and other development files
- **Production Deployment**: Deploy compressed archive to server, extract, run `npm install --production`, restart PM2 process
- **Critical Data Preservation**: Server's `data/` directory must be preserved during deployment (contains tokens, boards, pin counts, model settings)
- **No Compilation**: Project uses pure Node.js with no build/transpilation steps

## Security Implementations

### API Security
- **Bearer Token Authentication**: Pinterest and OpenAI APIs use bearer tokens
- **Environment Variable Storage**: All secrets managed via `.env` file
- **Token Isolation**: Pinterest tokens stored per Discord user with account separation

### Discord Security
- **Interaction Validation**: All interactions validated before processing
- **Error Message Sanitization**: API errors filtered before user display
- **Admin Command Protection**: Sensitive commands require admin permissions

## Code Quality Standards

### Modular Design Principles
- **Single Responsibility**: Each file handles one specific concern
- **Dependency Injection**: Services receive dependencies rather than importing globally
- **Error Boundary Isolation**: Errors contained within command execution scope

### Async/Await Patterns
- **Promise-Based**: All external API calls use async/await
- **Error Propagation**: Errors bubble up through proper try/catch blocks
- **Timeout Handling**: Long operations use deferred replies to prevent Discord timeouts

## Common Development Tasks

### Adding New Commands
1. Create command file in `src/commands/` with data/execute exports
2. Import command in `src/index.js`
3. Add command to REST.put() body array for registration
4. Add interaction handling in main interaction event listener
5. Update hardcoded console log message in ClientReady event

### Modifying System Prompts
- Use `/editprompt` command in Discord for live editing (admin-only)
- Create `.txt` files in `data/` directory (user-created, auto-loaded on restart)
- Use numeric prefixes for loading order (00_, 10_, 20_, etc.)
- System prompts are not included in repository - users must create their own

### Pinterest Integration Changes
- Pinterest API v5 endpoints and schemas
- OAuth callback handled by `pinterest-auth.php` (PHP) or `registerPinterestAuthRoute` (Express.js)
- Account data stored in `pinterest_tokens.json` with multi-account support
- Board caching in `boards.json` per Pinterest account ID

### Message Search Utilities
- `messageSearch.js` provides comprehensive channel history search capabilities
- Keyword variant generation (automatic singular/plural support)
- Image detection across attachments, embeds, and Midjourney patterns
- Pagination support for searching beyond Discord's 100-message limit
- Integration with `/pin` command's keyword search for automated message ID extraction

This architecture enables reliable, scalable Discord bot operations with comprehensive error handling and multi-user account management.