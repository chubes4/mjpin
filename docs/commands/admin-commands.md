# Admin Commands

Administrative commands requiring elevated Discord permissions.

## /model

Configures OpenAI model for server prompt generation.

**Parameters:** None

**Permission:** Requires Manage Server permission

**What it does:**
- Fetches available OpenAI models via API
- Filters to chat-capable models only
- Displays current model selection
- Allows model switching via dropdown menu
- Saves model preference per Discord guild

**Model filtering:**
Automatically excludes:
- Embedding models (text-embedding, embedding)
- Audio models (whisper, tts, audio, transcribe)
- Image models (dall, image, vision, clip)
- GPT-3 models
- Turbo variants
- Preview variants
- Fine-tuned models (ft:)
- Omni and sprite models

Includes only:
- Models matching `^(gpt|o[34]|gpt-4|gpt-5)`
- Chat-capable models from OpenAI API

**Selection interface:**
- Dropdown shows up to 25 filtered models
- Current model marked as "Currently selected"
- Selection times out after 60 seconds
- Model saved immediately on selection

**Model storage:**
- Saved per Discord guild ID
- Persists across bot restarts
- Stored in data/model_settings.json

**Prerequisites:**
- MJPIN_OPENAI_API_KEY environment variable configured
- Must run in Discord server (not DMs)

**Error handling:**
- No API key: Returns configuration error
- DM usage: Instructs server-only command
- No permission: Returns permission error
- API failure: Returns sanitized error message

**Use case:**
Server admin configures specific OpenAI model (e.g., gpt-4, o3-mini) for all prompt generation in their server. Different servers can use different models based on their needs and API access.

## /editprompt

Edits system prompt sections via Discord modal interface.

**Parameters:** None

**Permission:** Requires Administrator permission

**What it does:**
- Lists all .txt files in data/ directory as prompt sections
- Displays section selection dropdown
- Opens modal editor for selected section
- Saves changes to .txt file
- Reloads system prompt automatically after save

**Section discovery:**
- Scans data/ directory for .txt files
- Converts filenames to human-readable labels (underscores to spaces, title case)
- Each .txt file becomes selectable section

**Modal editor:**
- Shows current section content (up to 4000 characters)
- Text area supports multi-line editing
- Saves directly to .txt file on submit
- Truncates display to 4000 characters if longer

**System prompt assembly:**
After editing, system prompt reloads:
1. Reads all .txt files from data/ directory
2. Concatenates in alphanumeric order
3. Uses combined content for subsequent `/prompt` commands

**File naming convention:**
Use numeric prefixes for ordering:
- `00_base_instructions.txt`
- `10_style_guidelines.txt`
- `20_technical_details.txt`

**Section selection:**
1. Command shows dropdown of all sections
2. User selects section to edit
3. Modal opens with current content
4. User edits and submits
5. Confirmation message returned

**Prerequisites:**
- data/ directory must exist
- .txt files must exist in data/ directory (user-created)
- Administrator permission required

**Error handling:**
- No sections found: Returns error message
- No permission: Returns permission denied
- Write failure: Returns error with details

**Use case:**
Administrator wants to refine Midjourney prompt generation behavior. Edits specific sections of system prompt (e.g., style guidelines, technical parameters) without restarting bot or editing files on server.

## /restart

Restarts bot process with post-restart confirmation.

**Parameters:** None

**Permission:** Requires Administrator permission

**What it does:**
- Saves restart context (channel ID, message ID)
- Sends "Restarting bot..." message
- Exits process with code 0
- PM2 automatically restarts process
- Updates original message to "Restart successful." on reconnection

**Restart flow:**
1. Command executed
2. Reply message posted: "Restarting bot..."
3. Context saved to data/restart_info.json
4. Process exits after 500ms delay
5. PM2 detects exit and restarts process
6. Bot reconnects to Discord
7. Reads restart_info.json
8. Edits original message to "Restart successful."
9. Deletes restart_info.json

**Restart context stored:**
- Channel ID (where command executed)
- Message ID (restart message to update)
- Timestamp (for reference)

**Prerequisites:**
- Bot must run under PM2 process manager
- PM2 must be configured for automatic restart
- Administrator permission required

**Error handling:**
- No permission: Returns permission denied
- Post-restart update failure: Logs error and cleans up restart file
- Missing restart file: Continues normal startup

**Use case:**
Administrator applies configuration changes or needs to reset bot state without SSH access to server. Bot restarts cleanly and confirms successful restart in Discord.
