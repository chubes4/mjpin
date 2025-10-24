# Discord.js Integration

Discord bot implementation using discord.js v14 with slash commands and message content access.

## Bot Configuration

**Required intents:**
- `GatewayIntentBits.Guilds` - Guild information access
- `GatewayIntentBits.GuildMessages` - Message history access
- `GatewayIntentBits.MessageContent` - Message content and attachments

**Message content intent:**
Required for image URL extraction from Discord messages. Without this intent, bot cannot access attachment URLs or embed content.

## Command Registration

**Registration scope:**
Guild-specific registration via REST API.

**Registration endpoint:**
`Routes.applicationGuildCommands(clientId, guildId)`

**Registered commands:**
- `/pin` - Search for and pin images to Pinterest
- `/prompt` - Generate Midjourney prompts
- `/sync` - Sync Pinterest boards
- `/auth` - Authenticate with Pinterest
- `/settings` - Manage Pinterest accounts
- `/restart` - Restart bot process
- `/editprompt` - Edit system prompt sections
- `/model` - Configure OpenAI model

**Registration timing:**
Commands registered on `ClientReady` event after bot connects.

**Command structure:**
Each command exports:
- `data` - SlashCommandBuilder instance
- `execute` - Async function handling interaction

## Interaction Handling

**Interaction types supported:**
- Chat input commands (slash commands)
- String select menus (dropdowns)
- Modal submits (text input forms)

**Interaction routing:**
Main interaction handler in src/index.js routes interactions to command modules based on:
- Command name for slash commands
- Custom ID for select menus and modals

**Deferred replies:**
All commands use `interaction.deferReply()` for operations exceeding 3 seconds:
- Pinterest API calls
- OpenAI API calls
- Board synchronization
- Message history searches

**Ephemeral messages:**
Used for:
- `/auth` - Authorization URLs (privacy)
- `/settings` - Account management (privacy)
- `/model` - Configuration (reduces channel clutter)
- `/editprompt` - Admin operations (security)
- `/restart` - Admin operations (security)

## Message Fetching

**Fetch methods:**
- `channel.messages.fetch(messageId)` - Single message by ID
- `channel.messages.fetch({ limit: N })` - Recent messages
- `channel.messages.fetch({ before: id, limit: N })` - Paginated backward
- `channel.messages.fetch({ after: id, limit: N })` - Paginated forward

**Pagination limits:**
- Maximum 100 messages per fetch
- Rate limited to prevent API throttling (100ms delay between batches)
- `/pin` searches up to 1000 messages maximum

**Message content access:**
- `message.content` - Text content
- `message.attachments` - Attachment collection
- `message.embeds` - Embed array
- `message.interaction` - Command interaction metadata

**Image detection:**
Bot checks multiple sources:
1. Direct attachments: `message.attachments.first().url`
2. Embed images: `message.embeds[0].image.url`
3. Embed thumbnails: `message.embeds[0].thumbnail.url`

## Error Handling

**Global error handlers:**
- `unhandledRejection` - Logs and continues
- `uncaughtException` - Logs and exits with code 1
- `SIGTERM` - Graceful shutdown with client.destroy()
- `SIGINT` - Graceful shutdown with client.destroy()

**Command error handling:**
Centralized in interaction event handler:
1. Try command execution
2. Catch errors
3. Respond with generic error message
4. Multiple response strategies:
   - Not replied/deferred: Use `reply()` with ephemeral flag
   - Deferred: Use `editReply()`
   - Already replied: Use `followUp()` with ephemeral flag

**Component interaction timeouts:**
Select menus and modals timeout after 60 seconds:
- `/settings` account selection
- `/model` model selection
- No timeout for `/editprompt` modal

## Permission Checks

**Permission system:**
Commands verify Discord permissions before execution.

**Permission levels:**
- Manage Server (`ManageGuild`): `/model`, `/sync`
- Administrator (`Administrator`): `/editprompt`, `/restart`

**Permission check implementation:**
```javascript
interaction.member.permissions.has(PermissionsBitField.Flags.PermissionName)
```

**Permission denied responses:**
Ephemeral messages indicating insufficient permissions.

## Login and Reconnection

**Login retry logic:**
- Maximum 3 retry attempts
- Exponential backoff: 2^retry * 1000ms
- Exit with code 1 if all retries fail

**Connection events:**
- `ClientReady` - Initial connection established
- `Error` - Client error occurred
- `Disconnect` - Client disconnected
- `Reconnecting` - Reconnection attempt in progress
- `Resume` - Connection resumed after disconnect

**Restart handling:**
Bot reads data/restart_info.json on startup:
- Fetches original restart message
- Updates to "Restart successful."
- Deletes restart info file
- Logs success or errors

## Environment Configuration

**Required environment variables:**
- `MJPIN_DISCORD_TOKEN` - Bot authentication token
- `MJPIN_DISCORD_CLIENT_ID` - Application client ID
- `MJPIN_DISCORD_GUILD_ID` - Target guild for command registration

**Token security:**
Token logged as '[HIDDEN]' in console output.
