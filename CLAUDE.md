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
- **/pin**: Pin 1-10 images from Discord message IDs to Pinterest boards with rate limiting
- **/gather**: Search channel history for keyword-matching images and generate `/pin` command
- **/prompt**: Generate Midjourney prompts using OpenAI with per-guild model selection

### Account Management Commands
- **/auth**: Generate Pinterest OAuth2 authorization URL for account linking
- **/sync**: Fetch and cache Pinterest boards for authenticated account
- **/settings**: View/switch active Pinterest account and check pin count status

### Admin Commands
- **/model**: Select OpenAI model for the server from available chat-capable models
- **/editprompt**: Edit system prompt `.txt` files via Discord modals with section selection
- **/restart**: Restart bot process (admin-only, requires PM2 deployment)

## External Integrations

### Pinterest API v5 Integration
- **OAuth2 Flow**: Express.js callback endpoint handles authorization code exchange
- **Multi-Account Support**: Multiple Pinterest accounts per Discord user with account switching
- **Board Management**: Cached board data per Pinterest account with sync capability
- **Rate Limiting**: 100 pins per 12-hour sliding window per Pinterest account

### OpenAI API Integration
- **Per-Guild Model Selection**: Each Discord server configures preferred chat model
- **Modular Prompt Assembly**: System prompts built from concatenated `.txt` files in `data/`
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
├── *.txt                    # System prompt chunks (auto-loaded, order by numeric prefix)
├── pinterest_tokens.json    # Multi-account Pinterest OAuth tokens per Discord user
├── boards.json             # Cached Pinterest boards per Pinterest account
├── pin_counts.json         # Sliding window rate limit data per Pinterest account
└── model_settings.json     # OpenAI model selection per Discord guild
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
- **Development**: `npm start` with nodemon for hot reloading
- **Production**: PM2 process manager with graceful shutdown handling
- **OAuth Callback**: Requires publicly accessible endpoint for Pinterest authorization

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
2. Import and register in `src/index.js` commands array
3. Add interaction handling in main interaction event listener
4. Update console log message with new command name

### Modifying System Prompts
- Use `/editprompt` command in Discord for live editing
- Add new `.txt` files to `data/` directory (auto-loaded on restart)
- Use numeric prefixes for loading order (00_, 10_, 20_, etc.)

### Pinterest Integration Changes
- Pinterest API v5 endpoints and schemas
- Account data stored in `pinterest_tokens.json` with multi-account support
- Board caching in `boards.json` per Pinterest account ID

This architecture enables reliable, scalable Discord bot operations with comprehensive error handling and multi-user account management.