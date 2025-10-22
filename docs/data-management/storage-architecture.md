# Storage Architecture

File-based JSON storage for all persistent data in data/ directory.

## File Structure

**Data directory:** `/data/`

**Stored files:**
- `pinterest_tokens.json` - OAuth tokens and account information
- `boards.json` - Cached Pinterest board data per account
- `pin_counts.json` - Rate limit tracking timestamps per account
- `model_settings.json` - OpenAI model selection per Discord guild
- `restart_info.json` - Temporary restart context (auto-deleted)
- `*.txt` - System prompt sections (user-created, not in repository)

## JSON File Operations

**File manager:** `src/utils/jsonFileManager.js`

**Core operations:**
- `readJsonFile(filename)` - Read and parse JSON file
- `writeJsonFile(filename, data)` - Write object as formatted JSON
- `readTextFile(filename)` - Read text file content

**Read behavior:**
- Returns parsed object if file exists
- Returns empty object `{}` if file not found (ENOENT)
- Throws error for other failures (permissions, invalid JSON)

**Write behavior:**
- Creates data/ directory if missing (recursive)
- Writes JSON with 2-space indentation
- Overwrites existing files
- Throws error on write failures

**Error handling:**
- File not found: Returns default value (empty object)
- Parse errors: Logged and thrown
- Write errors: Logged and thrown

## Pinterest Token Storage

**File:** `pinterest_tokens.json`

**Structure:**
```json
{
  "discord_user_id": {
    "accounts": {
      "pinterest_user_id": {
        "accessToken": "pint_bearer_token",
        "pinterestUserId": "pinterest_id",
        "accountName": "username (id_prefix)",
        "createdAt": "2025-10-01T12:00:00.000Z"
      }
    },
    "activeAccount": "pinterest_user_id"
  }
}
```

**Key relationships:**
- Discord user ID → Multiple Pinterest accounts
- Pinterest user ID → Single account data object
- Active account → Pinterest user ID reference

**Account data fields:**
- `accessToken` - OAuth bearer token for API requests
- `pinterestUserId` - Unique Pinterest account identifier
- `accountName` - Display name: `username (first8chars)`
- `createdAt` - ISO 8601 timestamp of account linking

**Operations:**
- Add account: Creates nested structure if Discord user new
- First account: Automatically set as active
- Switch account: Updates activeAccount reference
- Delete account: Not implemented (manual file edit required)

## Board Cache Storage

**File:** `boards.json`

**Structure:**
```json
{
  "pinterest_user_id": [
    {
      "id": "board_identifier",
      "name": "Board Name"
    }
  ]
}
```

**Key relationships:**
- Pinterest user ID → Array of board objects
- Each account maintains separate board list

**Board data fields:**
- `id` - Pinterest API board identifier
- `name` - User-visible board name

**Update mechanism:**
- Full replacement on `/sync` command
- No incremental updates
- No automatic synchronization

**Usage:**
- Board name validation in `/pin` command
- Case-insensitive matching
- Must sync before first pin operation

## Rate Limit Storage

**File:** `pin_counts.json`

**Structure:**
```json
{
  "pinterest_user_id": [
    1727784000000,
    1727784120000,
    1727784240000
  ]
}
```

**Key relationships:**
- Pinterest user ID → Array of pin timestamps
- Each timestamp = one successful pin

**Timestamp format:**
Unix milliseconds (Date.now())

**Sliding window implementation:**
1. Load all timestamps for account
2. Filter timestamps within last 12 hours (43,200,000ms)
3. Count remaining timestamps
4. Record new pin by adding timestamp
5. Save filtered + new timestamps

**Automatic cleanup:**
Old timestamps (>12 hours) filtered out on every operation.

**Limit enforcement:**
- Maximum 100 timestamps per account
- Pre-flight check before pin batch
- Real-time check before each pin

## Model Settings Storage

**File:** `model_settings.json`

**Structure:**
```json
{
  "discord_guild_id": "openai_model_id"
}
```

**Key relationships:**
- Discord guild ID → Single OpenAI model ID
- One model per guild

**Model ID format:**
OpenAI model identifier (e.g., "gpt-4", "o3-mini")

**Operations:**
- Get model: Returns null if guild not configured
- Set model: Creates or updates guild entry
- No default model: Guilds must explicitly configure

**Validation:**
No validation on save. Assumes model ID from `/model` command already filtered.

## Restart Context Storage

**File:** `restart_info.json`

**Lifecycle:** Temporary (created on restart, deleted on reconnection)

**Structure:**
```json
{
  "channelId": "discord_channel_id",
  "messageId": "discord_message_id",
  "timestamp": 1727784000000
}
```

**Usage:**
1. Created by `/restart` command before exit
2. Read by bot on reconnection
3. Used to update restart message
4. Deleted after successful update

**Error handling:**
If update fails:
- Error logged
- File still deleted
- Bot continues normal operation

## Data Directory Management

**Creation:**
data/ directory created automatically on first write operation.

**Permissions:**
Requires write access to application directory.

**Version control:**
- data/ directory excluded from git (.gitignore)
- System prompt .txt files user-created, not in repository
- Empty data/ structure created on deployment

**Backup:**
No automatic backup. Critical data stored in single directory for easy backup.

**Migration:**
No migration system. Manual file editing required for schema changes.
