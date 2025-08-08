# mjpin Data Directory

This folder contains the prompt source files and runtime state for the bot.

- All `.txt` files directly in `data/` are concatenated (with a blank line between each) to form the system prompt used by the bot at startup.
- Admins can edit any `.txt` file via the `/editprompt` command in Discord.
- Runtime JSON state (tokens, boards, rate limits) is also stored here and should not be committed.

## What gets loaded into the system prompt

- Any file ending in `.txt` placed at the top level of `data/` is included.
- The files are concatenated; to control order, use numeric prefixes:
  - `00_instructions.txt`
  - `10_styles.txt`
  - `20_mediums.txt`
  - `30_artists.txt`
  - `40_backgrounds.txt`
  - `50_modifiers.txt`

Tip: Lower numbers load first. Keep high-level instructions first, supporting prompt chunks after (e.g., styles, mediums, backgrounds).

## Private prompt files

If you keep private prompt content, name them so they’re ignored by git but still end with `.txt` so the bot loads them, for example:
- `*.private.txt` (e.g., `99_personal_brand.private.txt`)
- `*.local.txt` (e.g., `98_experiments.local.txt`)

Add ignore rules for those patterns in your `.gitignore`.

## Runtime files (do not commit)

- `pinterest_tokens.json` (OAuth tokens)
- `boards.json` (board cache)
- `pin_counts.json` (rate-limit sliding window)

These are created automatically by the bot.

## Minimal example: instructions file

If you want a simple, clean starting point that the bot will respect, create a file like `00_instructions.txt` containing:

```
You respond ONLY with Midjourney prompts.

- Default to three different prompts unless the user explicitly requests another number.
- Each prompt must start with `/imagine prompt:` and end with `--ar 9:16`.
- If the user's message contains "double quoted text", include that exact text with the quotes inside each prompt.
```

Users can customize the language above as they wish; this template simply enforces the correct output format for the bot.

## Optional prompt chunk files

You can organize prompt content across multiple `.txt` files to avoid Discord modal limits and keep things modular. Common chunk types include:

- `styles.txt`
- `mediums.txt`
- `artists.txt`
- `backgrounds.txt`
- `modifiers.txt`

The content can be comma-separated or line-separated. The model will see these chunks along with your instructions and you can describe how to use them in `00_instructions.txt`.

Example `styles.txt`:

```
Retro, Minimalist, Hyperrealism, Art Nouveau, Pop Art, Vaporwave, Americana
```

You can add or remove chunk files at any time.

## Editing via Discord

- Use `/editprompt` (admin only) to select any `.txt` file in `data/` and edit its contents.
- After saving, the bot reloads the system prompt automatically.

## Troubleshooting

- If no `.txt` files can be read, the bot falls back to `MJPIN_OPENAI_SYSTEM_PROMPT` from your `.env`.
- If private files appear in the `/editprompt` menu, that’s expected. To keep them private, rely on git ignores and avoid editing them via the UI. 