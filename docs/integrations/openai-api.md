# OpenAI API Integration

OpenAI ChatGPT API integration with per-guild model selection and modular prompt system.

## Model Selection

**API endpoint:** `https://api.openai.com/v1/models`

**Model filtering:**
Bot filters available models to chat-capable models only.

**Exclusion patterns:**
- Embedding models: `/(embedding|text-embedding)/i`
- Audio models: `/(whisper|tts|audio|transcribe)/i`
- Image models: `/(dall|image|vision|clip)/i`
- GPT-3 variants: `/^gpt-3/i`
- Turbo variants: `/turbo/i`
- Preview variants: `/preview/i`
- Fine-tuned models: `/ft:/i`
- Omni/sprite models: `/(omni|sprites)/i`

**Inclusion pattern:**
Models must match: `/^(gpt|o[34]|gpt-5(?:\.\d+)?)/i`

**Selection interface:**
- Administrator runs `/model` command
- Bot fetches and filters models
- Dropdown shows up to 25 chat-capable models
- Selection saved per Discord guild

**Storage:**
data/model_settings.json - Guild ID to model ID mapping

**Model operations:**
- `getModelForGuild(guildId)` - Returns configured model ID for guild
- `setModelForGuild(guildId, modelId)` - Saves model selection

**Validation:**
No validation beyond filtering. Assumes filtered models support chat completions API.

## Modular System Prompt

**Prompt assembly:**
System prompt built from multiple .txt files in data/ directory.

**Loading process:**
1. Scan data/ directory for .txt files
2. Read each file's content
3. Sort files alphanumerically
4. Concatenate with double newline separator
5. Store in memory

**File ordering:**
Use numeric prefixes for consistent ordering:
- `00_base_instructions.txt`
- `10_style_parameters.txt`
- `20_technical_details.txt`
- `30_constraints.txt`

**Dynamic reloading:**
- Loads on bot startup
- Reloads after `/editprompt` saves changes
- No bot restart required

**Fallback behavior:**
If no .txt files exist or readable:
- Falls back to MJPIN_OPENAI_SYSTEM_PROMPT environment variable
- If environment variable missing, uses default: "You are a helpful AI that generates Midjourney prompts."

**Section editing:**
Via `/editprompt` command:
- Lists all .txt files as selectable sections
- Opens modal editor for selected file
- Saves changes directly to file
- Triggers automatic reload

## Chat Completions

**API endpoint:** `https://api.openai.com/v1/chat/completions`

**Request format:**
```json
{
  "model": "guild_specific_model_id",
  "messages": [
    {
      "role": "system",
      "content": "assembled_system_prompt"
    },
    {
      "role": "user",
      "content": "user_input_from_prompt_command"
    }
  ]
}
```

**Authentication:**
Bearer token in Authorization header from MJPIN_OPENAI_API_KEY environment variable.

**Message structure:**
Two-message conversation:
1. System message with assembled prompt
2. User message with input from `/prompt` command

**Response handling:**
- Extracts content from `response.data.choices[0].message.content`
- Truncates to 2000 characters if longer (Discord limit)
- Returns truncated text with ellipsis

**Error handling:**
- Extracts error from `response.data.error.message`
- Falls back to generic error.message
- Prefixes with "OpenAI API error: "
- Returns sanitized message to user

## Configuration

**Required environment variables:**
- `MJPIN_OPENAI_API_KEY` - OpenAI API bearer token

**Optional environment variables:**
- `MJPIN_OPENAI_SYSTEM_PROMPT` - Fallback system prompt if no .txt files

**Prerequisites:**
- Guild administrator must configure model via `/model` command before first `/prompt` use
- System prompt files should exist in data/ directory (user-created)

**Initialization:**
- System prompt loads automatically on bot startup
- Model selection required per guild before prompt generation
- No global model default

## Prompt Generation Workflow

**User perspective:**
1. User runs `/prompt input:"describe desired image"`
2. Bot defers reply (operation may exceed 3 seconds)
3. Bot retrieves guild's configured model
4. Bot retrieves assembled system prompt
5. Bot sends request to OpenAI API
6. Bot returns generated prompt to user

**Error scenarios:**
- No model configured: "OpenAI model is not configured for this server. Ask an admin to run /model to set it."
- No API key: "OpenAI API key not set in environment."
- API failure: "OpenAI API error: [sanitized_error_message]"

**Response formatting:**
- Full response if under 2000 characters
- Truncated with "..." if over 2000 characters
- No markdown formatting applied by bot
