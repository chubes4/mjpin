# mjpin Discord Bot Documentation

Comprehensive user documentation for the mjpin Discord bot - automated Pinterest pinning and Midjourney prompt generation.

## What mjpin Does

mjpin automates three core workflows:

1. **Pinterest Integration**: Pin Discord images to Pinterest boards with multi-account support and rate limiting
2. **Automated Image Search**: Search channel history for keyword-matching images and automatically pin them
3. **Prompt Generation**: Generate Midjourney prompts using OpenAI with customizable system prompts

## Documentation Structure

### Commands

**[Workflow Commands](commands/workflow-commands.md)**
- `/pin` - Search channel history for keyword-matching images and pin to Pinterest boards
- `/prompt` - Generate Midjourney prompts with OpenAI

**[Account Management](commands/account-management.md)**
- `/auth` - Link Pinterest accounts via OAuth2
- `/sync` - Synchronize Pinterest boards
- `/settings` - View and switch between Pinterest accounts

**[Admin Commands](commands/admin-commands.md)**
- `/model` - Configure OpenAI model per server
- `/editprompt` - Edit system prompt sections
- `/restart` - Restart bot with confirmation

### Integrations

**[Pinterest API](integrations/pinterest-api.md)**
- OAuth2 authentication flow
- Multi-account architecture
- Board synchronization
- Pin creation
- Rate limiting (100 pins per 12 hours per account)

**[OpenAI API](integrations/openai-api.md)**
- Model selection and filtering
- Modular system prompt assembly
- Chat completions API
- Per-guild configuration

**[Discord Integration](integrations/discord-integration.md)**
- Command registration
- Interaction handling
- Message fetching and pagination
- Permission checks
- Error handling

### Data Management

**[Storage Architecture](data-management/storage-architecture.md)**
- File-based JSON storage
- Pinterest token management
- Board caching
- Rate limit tracking
- Model settings

**[Rate Limiting](data-management/rate-limiting.md)**
- Sliding window algorithm
- Per-account tracking
- Multi-account support
- Enforcement points

**[Message Search](data-management/message-search.md)**
- Channel history search
- Keyword variant generation
- Image detection
- Message ID extraction

### Configuration

**[Environment Variables](configuration/environment-variables.md)**
- Discord configuration
- Pinterest OAuth credentials
- OpenAI API key
- Optional fallback settings

**[Deployment](configuration/deployment.md)**
- PM2 process management
- Restart behavior
- Data persistence
- Monitoring and logging

## Quick Start

**For Users:**
1. Run `/auth` to link Pinterest account
2. Run `/sync` to cache Pinterest boards
3. Run `/pin` with keyword and url parameters to automatically find and pin matching images

**For Server Admins:**
1. Configure OpenAI model: `/model`
2. Edit system prompts: `/editprompt`
3. Monitor via `/settings`

**For Bot Operators:**
1. Configure environment variables
2. Deploy with PM2
3. Preserve data/ directory across updates

## Key Features

**Multi-Account Pinterest Support:**
- Link multiple Pinterest accounts per Discord user
- Switch between accounts via `/settings`
- Separate rate limits per account
- 100 pins per 12 hours per account

**Intelligent Image Search:**
- Automatic keyword variant generation (singular/plural)
- Searches after last `/pin` command
- Detects Midjourney upscaled images only
- Pins up to 10 matching images per command

**Customizable Prompt Generation:**
- Per-guild OpenAI model selection
- Modular system prompt from .txt files
- Live editing via Discord modals
- Automatic prompt reloading

**Comprehensive Error Handling:**
- Graceful degradation on failures
- User-friendly error messages
- Automatic retry logic
- Process-level error handlers

## Architecture

**Modular Command Structure:**
- Commands in `src/commands/`
- Services in `src/services/`
- Utilities in `src/utils/`
- Data in `data/` directory

**Service Layer:**
- Pinterest API integration
- OpenAI API integration
- Model settings management

**Utility Layer:**
- JSON file management
- Rate limit tracking
- Message search operations

**Data Storage:**
- File-based JSON storage
- No database required
- Single data/ directory

## Component Coverage

**Commands (8):**
- pin, prompt, auth, sync, settings, model, editprompt, restart

**Services (3):**
- pinterest.js, openai.js, modelSettings.js

**Utilities (3):**
- jsonFileManager.js, pinRateLimit.js, messageSearch.js

**Data Files (5 + user .txt files):**
- pinterest_tokens.json, boards.json, pin_counts.json, model_settings.json, restart_info.json

**API Integrations (3):**
- Pinterest API v5
- OpenAI API v1
- Discord API v10

## User Workflows

**Pinning Workflow:**
1. Authenticate with Pinterest via `/auth`
2. Sync boards via `/sync`
3. Select active account via `/settings` (if multiple accounts)
4. Use `/pin` with keyword (used as board name) and URL
5. Bot searches channel history for keyword-matching images
6. Bot pins found images and tracks rate limit

**Prompt Generation Workflow:**
1. Admin configures model via `/model`
2. Admin customizes system prompt via `/editprompt`
3. Users run `/prompt` with input description
4. Bot returns generated Midjourney prompt

## Technical Requirements

**Runtime:**
- Node.js
- npm packages (see package.json)

**External Services:**
- Discord Bot (requires bot token and guild ID)
- Pinterest App (requires OAuth credentials)
- OpenAI API (requires API key)

**Deployment:**
- PM2 process manager recommended
- Publicly accessible callback URL for Pinterest OAuth
- Persistent data/ directory

## Security Considerations

**Token Storage:**
- OAuth tokens stored in data/pinterest_tokens.json
- Access tokens never logged
- File permissions should restrict access

**Environment Variables:**
- All secrets in environment variables
- Never commit .env file
- Use PM2 ecosystem config for production

**Permission Checks:**
- Admin commands require Administrator or Manage Server permissions
- Ephemeral messages for sensitive information
- OAuth state parameter validates Discord user ID
