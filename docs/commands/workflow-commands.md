# Workflow Commands

Core commands for pinning images and generating prompts.

## /pin

Searches channel history for keyword-matching images and pins them to Pinterest boards.

**Parameters:**
- `keyword` (required): Keyword to search for images. Also used as the Pinterest board name.
- `url` (required): Destination URL for all pins created.

**What it does:**
1. Searches channel history for images matching the keyword
2. Automatically searches from after the last `/pin` command (or recent messages if no previous `/pin` command)
3. Finds up to 10 matching images
4. Pins each found image to the Pinterest board that matches the keyword
5. Tracks rate limit (100 pins per 12 hours per Pinterest account)
6. Returns success/failure status for each pin with current rate limit count

**Search behavior:**
- Searches message content, embed descriptions, embed titles, and attachment filenames
- Generates keyword variants automatically (singular/plural forms)
- Matches Midjourney upscaled images only (containing "- Image #" pattern)
- Excludes 4-image grid previews
- Searches up to 1000 messages or until no more messages available
- Keyword is used as the board name (case-insensitive board matching)

**Image detection:**
- Direct message attachments (PNG, JPG, etc.)
- Embedded images in Discord message embeds

**Rate limiting:**
- Enforces 100 pins per 12-hour sliding window per Pinterest account
- Pre-flight check before starting pin batch
- Real-time check before each individual pin
- Stops automatically when account reaches limit
- Shows remaining pin capacity after each successful pin (format: "X/100")

**Prerequisites:**
- Must authenticate Pinterest account via `/auth`
- Must have an active account selected via `/settings` (if multiple accounts)
- Must sync boards via `/sync` to cache board list
- Board matching the keyword must exist in your Pinterest account

**Example:**
```
/pin keyword:cyberpunk url:https://example.com/cyberpunk
```
This searches for "cyberpunk" images and pins them to a board named "cyberpunk" (case-insensitive).

**Error handling:**
- **No active account**: Prompts user to run `/auth` and `/settings`
- **Invalid board name**: Lists all available boards for active account
- **No matching images**: Reports that no images were found matching the keyword
- **Rate limit reached**: Shows current count (e.g., "100/100") and stops processing remaining pins
- **No boards synced**: Prompts user to run `/sync`



## /prompt

Generates Midjourney prompts using OpenAI.

**Parameters:**
- `input` (required): Description of desired generation

**What it does:**
- Sends user input to OpenAI API
- Uses guild-specific model configured via `/model`
- Applies modular system prompt assembled from data/*.txt files
- Returns generated prompt truncated to Discord's 2000 character limit

**System prompt:**
- Assembled from all .txt files in data/ directory
- Files loaded in alphanumeric order (use numeric prefixes like 00_, 10_, 20_)
- Reloads automatically after `/editprompt` changes
- Falls back to MJPIN_OPENAI_SYSTEM_PROMPT environment variable if no files exist

**Prerequisites:**
- Guild administrator must configure model via `/model`
- OpenAI API key must be configured in environment
- System prompt files must exist in data/ directory (user-created)

**Error handling:**
- No model configured: Instructs admin to run `/model`
- API errors: Returns sanitized error message to user
- Response too long: Truncates to 2000 characters with ellipsis
