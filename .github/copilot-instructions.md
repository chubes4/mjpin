## mjpin — AI Agent Guide (concise)

Purpose: Discord bot that generates Midjourney prompts (OpenAI) and pins images to Pinterest. Code favors small command handlers and thin services.

Architecture
- Entry: `src/index.js` boots the Discord client, registers slash commands on ready, and routes interactions.
- Commands `src/commands/`:
  - `prompt.js` → OpenAI chat completion via `services/openai`.
  - `pin.js` → Pin images to Pinterest; enforces per-account limits.
  - `auth.js` → Start Pinterest OAuth (callback handled by `services/pinterest-auth.php`).
  - `sync.js` → Fetch and store boards for the active account.
  - `settings.js` → Select active Pinterest account (dropdown, ephemeral).
  - `editprompt.js` → Admin edit of `data/*.txt` prompt chunks (modal, 4k char limit) + hot reload.
- Services `src/services/`:
  - `openai.js` reads all `data/*.txt` into a single system prompt; posts to `/v1/chat/completions` with model from env or code default.
  - `pinterest.js` stores tokens/boards under `data/*.json`; calls Pinterest v5 (`/v5/pins`, `/v5/boards`).
  - `pinterest-auth.php` provides the OAuth code→token exchange endpoint.

Data directory (`data/`)
- All top-level `.txt` files are concatenated (with blank lines) to form the system prompt. Order via filenames (e.g., `00_`, `10_`).
- Runtime JSON (tokens, boards, rate limits) lives here and should not be committed.

Conventions & patterns
- Always `deferReply()` for long work, then `editReply()`; use ephemeral for admin/settings.
- Permissions: check `Administrator` or `ManageGuild` as appropriate.
- Error handling: wrap command bodies in try/catch; send a friendly error reply; process-level handlers in `src/index.js`.
- OpenAI: requires `MJPIN_OPENAI_API_KEY`. Current default model in `services/openai` is `gpt-5-mini` unless `MJPIN_OPENAI_MODEL` is set.
- OAuth: tokens are keyed per Discord user in `data/pinterest_tokens.json`; boards cached in `data/boards.json` per Pinterest user id.

Dev workflows
- Run: `npm start` (node 18+ recommended). PM2 optional via `ecosystem.config.js`.
- Commands register to a single guild on startup using `CLIENT_ID` + `GUILD_ID` from `.env`.

Gotchas
- Ensure `data/` exists and is rw at runtime, or `openai.loadSystemPrompt()` will fall back to `MJPIN_OPENAI_SYSTEM_PROMPT`.
- Some code references `../utils/pinRateLimit`; if missing, create it or adjust imports to avoid runtime errors.

Examples
```js
// Generate a prompt
const { generatePrompt } = require('../services/openai');
const text = await generatePrompt('neon retro poster');
```

Questions for maintainers
- Confirm intended location and API for pin rate limiting utilities under `src/utils/`.
- Should OpenAI model be strictly env-driven or updated at runtime via a command (and stored in `data/`)?
