## mjpin — AI Agent Guide

Purpose: Discord bot that generates Midjourney prompts (OpenAI) and pins images to Pinterest. Features multi-account support, per-guild model selection, and automated message gathering. Code favors small command handlers and thin services.

Architecture
- Entry: `src/index.js` boots the Discord client, registers slash commands on ready, routes interactions (commands, select menus, modals).
- Commands `src/commands/`:
  - `prompt.js` → OpenAI chat completion via `services/openai` with per-guild model selection.
  - `pin.js` → Pin images to Pinterest; enforces per-account rate limits.
  - `gather.js` → Search channel history for keyword-matching images after last `/pin` command; generate ready-to-use `/pin` command.
  - `auth.js` → Start Pinterest OAuth (callback handled by Express.js in `services/pinterest.js`).
  - `sync.js` → Fetch and store boards for the active account.
  - `settings.js` → Select active Pinterest account (dropdown, ephemeral).
  - `model.js` → Admin-only per-guild OpenAI model selection from available chat-capable models.
  - `editprompt.js` → Admin edit of `data/*.txt` prompt chunks (modal, 4k char limit) + hot reload.
  - `restart.js` → Admin-only bot restart via PM2 with post-restart message confirmation.
- Services `src/services/`:
  - `openai.js` reads all `data/*.txt` into a single system prompt; posts to `/v1/chat/completions` with per-guild model from `modelSettings.js`.
  - `pinterest.js` stores tokens/boards under `data/*.json`; calls Pinterest v5 (`/v5/pins`, `/v5/boards`); includes Express.js OAuth callback endpoint.
  - `modelSettings.js` manages per-guild OpenAI model storage in `model_settings.json`.
- Utils `src/utils/`:
  - `messageSearch.js` provides comprehensive channel history search with keyword variants, image detection, and pagination.
  - `pinRateLimit.js` enforces 100 pins per 12-hour sliding window per Pinterest account.
  - `jsonFileManager.js` handles JSON file read/write operations.

Data directory (`data/`)
- All top-level `.txt` files are concatenated (with blank lines) to form the system prompt. Order via filenames (e.g., `00_`, `10_`).
- **User-created**: Prompt `.txt` files are NOT included in the repository. Users must create their own.
- Runtime JSON (tokens, boards, rate limits, model settings, restart info) lives here and should not be committed.

Conventions & patterns
- Always `deferReply()` for long work, then `editReply()`; use ephemeral for admin/settings.
- Permissions: `/model` requires ManageGuild, `/restart` and `/editprompt` require Administrator.
- Error handling: wrap command bodies in try/catch; send a friendly error reply; process-level handlers in `src/index.js`.
- OpenAI: requires `MJPIN_OPENAI_API_KEY`. Model selection is per-guild via `/model` command (stored in `model_settings.json`). Automatically filters to chat-capable models only.
- OAuth: tokens are keyed per Discord user in `data/pinterest_tokens.json`; boards cached in `data/boards.json` per Pinterest account ID.
- Message search: `messageSearch.js` provides keyword variant generation (singular/plural), image detection (attachments, embeds, Midjourney patterns), and pagination.

Dev workflows
- Run: `npm start` (node 18+ recommended). PM2 optional via `ecosystem.config.js`.
- Commands register to a single guild on startup using `CLIENT_ID` + `GUILD_ID` from `.env`.

Gotchas
- Ensure `data/` exists and is rw at runtime, or `openai.loadSystemPrompt()` will fall back to `MJPIN_OPENAI_SYSTEM_PROMPT`.
- Prompt `.txt` files are user-created (not in repo); `/prompt` requires per-guild model via `/model` first.
- OAuth callback uses built-in Express.js server in `pinterest.js` (no PHP required).

Examples
```js
// Generate a prompt with per-guild model
const { generatePrompt } = require('../services/openai');
const text = await generatePrompt('neon retro poster', guildId);

// Search for keyword-matching images
const { extractImageMessageIds } = require('../utils/messageSearch');
const messageIds = await extractImageMessageIds(channel, 'cyberpunk', lastPinMessage, 10);

// Get/set guild model
const { getModelForGuild, setModelForGuild } = require('../services/modelSettings');
const currentModel = await getModelForGuild(guildId);
await setModelForGuild(guildId, 'gpt-4o');
```
