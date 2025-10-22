# Workflow Commands

Core commands for pinning images and generating prompts.

## /pin

Pins Discord images to Pinterest boards.

**Parameters:**
- `board` (required): Pinterest board name
- `message_id_1` through `message_id_10`: Discord message IDs containing images (1-10 messages)
- `url` (required): Destination URL for all pins

**What it does:**
- Fetches images from specified Discord message IDs
- Pins images to specified Pinterest board using active account
- Tracks rate limit (100 pins per 12 hours per account)
- Returns success/failure status for each pin with current rate limit count

**Image detection:**
- Direct message attachments
- Embedded images in message embeds

**Rate limiting:**
- Stops automatically when account reaches 100 pins in 12-hour sliding window
- Shows remaining pin capacity after each successful pin
- Skips remaining pins when limit reached

**Prerequisites:**
- Must authenticate via `/auth`
- Must select active account via `/settings`
- Must sync boards via `/sync`
- Board name must match existing Pinterest board exactly (case-insensitive)

**Error handling:**
- Invalid board name: Lists all available boards for active account
- Missing images: Reports which messages lack images
- Rate limit reached: Shows current count and stops processing
- No active account: Prompts user to authenticate and select account

## /gather

Searches channel history for keyword-matching images and generates ready-to-use `/pin` command.

**Parameters:**
- `keyword` (required): Search term for image messages (automatic singular/plural support)
- `url` (optional): Pre-fill destination URL in generated command

**What it does:**
- Finds last `/pin` command execution in channel
- Searches all messages after that point for keyword matches
- Generates keyword variants (singular/plural forms)
- Extracts message IDs from matching images
- Returns ready-to-use `/pin` command with all parameters filled

**Search behavior:**
- Searches content, embed descriptions, embed titles, and attachment names
- Matches Midjourney upscaled images (containing "- Image #")
- Excludes 4-image grid previews
- Returns up to 10 matching message IDs
- Searches up to 1000 messages or until no more messages available

**Search scope:**
- With previous `/pin`: Searches all messages after last `/pin` command
- Without previous `/pin`: Searches 100 most recent messages

**Generated command format:**
```
/pin board:keyword url:destination_url message_id_1:123 message_id_2:456 ...
```

**Use case:**
User wants to pin all "landscape" images posted after their last pinning session. Command searches channel history, finds matching images, and generates the complete `/pin` command to execute.

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
