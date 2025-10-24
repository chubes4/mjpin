# Message Search System

Discord channel history search with keyword filtering and image detection for `/pin` command.

## Search Functions

**Utility module:** `src/utils/messageSearch.js`

**Core functions:**
- `findLastPinCommand(channel, maxMessages)` - Locates last `/pin` command execution
- `searchMessagesAfter(channel, afterMessageId, maxMessages)` - Fetches messages after reference point
- `generateKeywordVariants(keyword)` - Creates singular/plural variations
- `messageMatchesKeywords(message, keywordVariants)` - Tests message content against keywords
- `messageHasImages(message)` - Detects Midjourney upscaled images
- `extractImageMessageIds(channel, keyword, afterMessage, maxResults)` - Combines all functions for `/pin` command

## Last Pin Command Search

**Purpose:**
Finds most recent `/pin` command execution in channel.

**Algorithm:**
1. Fetch messages in batches of 100 (Discord limit)
2. Iterate through messages chronologically
3. Check for interaction command name = "pin"
4. Return first matching message
5. Continue pagination if not found

**Pagination:**
- Uses `before` parameter for backward pagination
- Maximum 500 messages searched by default
- 100ms delay between batches to prevent rate limiting

**Return value:**
- Message object if found
- `null` if no `/pin` command found in range

**Use case:**
Establishes search starting point for `/pin` command.

## Message Pagination

**Backward pagination:**
Uses `before` parameter to fetch older messages.

**Forward pagination:**
Uses `after` parameter to fetch newer messages.

**Batch size:**
100 messages per fetch (Discord maximum).

**Rate limiting:**
100ms delay between fetches to prevent API throttling.

**Continuation:**
Stops when:
- Batch returns zero messages
- Maximum message limit reached
- All available messages fetched

## Keyword Variant Generation

**Purpose:**
Automatically handles singular/plural forms.

**Algorithm:**
1. Start with lowercase keyword
2. If doesn't end with 's': Add plural form (keyword + 's')
3. If ends with 's' and length > 1: Add singular form (keyword - 's')

**Examples:**
- "cat" → ["cat", "cats"]
- "dogs" → ["dogs", "dog"]
- "mouse" → ["mouse", "mouses"] (Note: Not linguistically perfect)

**Limitations:**
- Simple suffix-based logic
- No irregular plural handling (mouse/mice, child/children)
- No stemming or lemmatization

## Keyword Matching

**Search locations:**
- Message content (`message.content`)
- Embed descriptions (`embed.description`)
- Embed titles (`embed.title`)
- Attachment names (`attachment.name`)

**Match algorithm:**
1. Collect all text from search locations
2. Join into single lowercase string
3. Test each keyword variant with `includes()`
4. Return true if any variant matches

**Match type:**
Substring match (case-insensitive).

**Examples:**
- Keyword "cat" matches "I love cats"
- Keyword "dog" matches "doghouse"
- Keyword "art" matches "artificial"

## Image Detection

**Detection criteria:**
Messages must contain:
1. Text "- Image #" in message content (Midjourney format)
2. Actual image attachment or embed

**Midjourney format:**
- Upscaled images contain "- Image #1", "- Image #2", etc.
- 4-image grid previews do not contain "- Image #"

**Image sources:**
1. Attachments with `image/*` content type
2. Embed image property
3. Embed thumbnail property

**Exclusion:**
4-image grids excluded automatically by "- Image #" requirement.

**Purpose:**
Ensures found messages contain single upscaled images suitable for pinning.

## Message ID Extraction

**Purpose:**
Main function for `/pin` command - combines all search capabilities.

**Parameters:**
- `channel` - Discord channel to search
- `keyword` - Search term
- `afterMessage` - Optional reference message (last `/pin` command)
- `maxResults` - Maximum message IDs to return (default 10)

**Algorithm:**
1. Generate keyword variants (singular/plural)
2. Determine search scope:
   - With afterMessage: Search messages after that point
   - Without afterMessage: Search 100 most recent messages
3. Iterate through messages
4. For each message:
   - Check if has images (Midjourney upscaled format)
   - Check if matches keywords
   - Add message ID to results if both true
5. Stop when maxResults reached or messages exhausted

**Return value:**
Array of message IDs (strings) matching criteria.

**Search limits:**
- Maximum 10 results by default (customizable)
- Searches up to 1000 messages when afterMessage provided
- Searches 100 messages when no afterMessage

## Search Scope Determination

**With previous /pin command:**
1. `/pin` finds last `/pin` execution
2. Searches messages posted after that point
3. Useful for finding new images since last pinning session

**Without previous /pin command:**
1. Searches 100 most recent messages
2. Useful for first-time usage in channel

**Message ordering:**
Messages processed chronologically from reference point forward.

## Error Handling

**Search failures:**
- Logged to console
- Returns empty array
- Does not throw errors

**Pagination failures:**
- Returns messages collected so far
- Logged to console

**Rate limiting:**
Built-in delays prevent Discord API rate limits.

## Performance

**Fetch operations:**
- Minimum 1 fetch (100 messages)
- Maximum 10 fetches (1000 messages)
- 100ms delay between fetches = 1 second maximum delay

**Processing:**
- Linear iteration through messages
- No indexing or caching
- Real-time search on command execution

**Memory:**
Messages stored in array during search, released after completion.
