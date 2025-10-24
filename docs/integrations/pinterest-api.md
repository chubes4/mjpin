# Pinterest API Integration

Pinterest API v5 integration with multi-account OAuth2 support.

## OAuth2 Authentication

**Authorization flow:**
1. User executes `/auth` command
2. Bot generates OAuth URL with state parameter (Discord user ID)
3. User authorizes via Pinterest website
4. Pinterest redirects to callback URL with authorization code
5. Bot exchanges code for access token automatically
6. Account information retrieved and stored

**OAuth endpoint:** `https://www.pinterest.com/oauth/`

**Token exchange endpoint:** `https://api.pinterest.com/v5/oauth/token`

**Required OAuth scopes:**
- `boards:read` - Read board information
- `boards:write` - Create and modify boards
- `pins:read` - Read pin information
- `pins:write` - Create pins
- `user_accounts:read` - Read account information

**Callback handling:**
OAuth callback handler (`src/services/pinterest-auth.php`) handles authorization code exchange:
- Validates authorization code and state parameters
- Exchanges code for access token via Pinterest API
- Fetches user account information
- Generates account name: `username (first8chars_of_pinterest_id)`
- Stores account data with Discord user ID mapping
- Returns success message to browser

Note: An alternative Express.js callback implementation exists in `pinterest.js` (`registerPinterestAuthRoute` function) but requires an Express server to be initialized.

**Token storage:**
Access tokens stored per Pinterest account:
- Bearer token format
- Stored in data/pinterest_tokens.json
- Keyed by Discord user ID with nested accounts object
- Each account identified by Pinterest user ID

## Multi-Account Architecture

**Account structure:**
```json
{
  "discord_user_id": {
    "accounts": {
      "pinterest_user_id": {
        "accessToken": "bearer_token",
        "pinterestUserId": "pinterest_id",
        "accountName": "username (id_prefix)",
        "createdAt": "ISO_timestamp"
      }
    },
    "activeAccount": "pinterest_user_id"
  }
}
```

**Account operations:**
- `getActiveAccount(discordUserId)` - Returns active account object
- `getAllAccounts(discordUserId)` - Returns array of all account objects
- `setActiveAccount(discordUserId, pinterestUserId)` - Changes active account
- `saveAccount(discordUserId, pinterestUserId, accessToken, accountName)` - Stores new account

**Active account logic:**
- First linked account automatically set as active
- User switches accounts via `/settings` command
- All `/pin` and `/sync` operations use active account
- Each account maintains separate rate limit tracking

## Board Management

**Board synchronization:**
API endpoint: `https://api.pinterest.com/v5/boards`

**Pagination handling:**
- Initial request returns up to 100 boards
- Response includes `bookmark` token for next page
- Subsequent requests include bookmark parameter
- Continues until bookmark is null

**Board data structure:**
```json
{
  "pinterest_user_id": [
    {
      "id": "board_id",
      "name": "Board Name"
    }
  ]
}
```

**Storage:**
- Cached in data/boards.json
- Keyed by Pinterest user ID
- Updated via `/sync` command
- Used for board name validation in `/pin` command

**Board operations:**
- `getBoardsForAccount(pinterestUserId)` - Returns cached boards array
- `saveBoardsForAccount(pinterestUserId, boardsArray)` - Updates cache

## Pin Creation

**API endpoint:** `https://api.pinterest.com/v5/pins`

**Request format:**
```json
{
  "board_id": "board_identifier",
  "media_source": {
    "source_type": "image_url",
    "url": "discord_image_url"
  },
  "link": "destination_url"
}
```

**Authentication:**
Bearer token in Authorization header from active account.

**Image source handling:**
Discord images automatically hosted by Discord CDN:
- Direct attachment URLs
- Embed image URLs
- No rehosting required

**Response validation:**
Success determined by presence of `id` field in response data.

**Error handling:**
- API errors logged with full response data
- Error messages extracted from response.data.message
- Sanitized errors returned to user

## Rate Limiting

**Pinterest API limits:**
100 pins per 12 hours per account (Pinterest enforced).

**Bot implementation:**
- Tracks pins per account in sliding 12-hour window
- Checks limit before each pin operation
- Stops processing when limit reached
- Returns current count after each successful pin

**Rate limit storage:**
data/pin_counts.json - Array of timestamps per account

**Limit enforcement:**
- Pre-flight check before starting pin batch
- Real-time check before each individual pin
- Automatic stop when limit reached mid-batch

**User notification:**
Shows format: "12-hour pin count: X/100" after each pin.

## OAuth Callback Implementation

**Purpose:**
Handle Pinterest OAuth2 authorization code exchange.

**Primary Implementation:**
PHP script (`src/services/pinterest-auth.php`) deployed to publicly accessible endpoint.

**PHP Callback Requirements:**
- PHP with curl extension
- Publicly accessible URL matching `MJPIN_PINTEREST_REDIRECT_URI`
- Environment variables configured for PHP execution
- Direct file system access to project's `data/` directory

**Alternative Implementation:**
Express.js route (`registerPinterestAuthRoute` in `pinterest.js`) provides an alternative callback handler:
- Requires Express server to be initialized and listening
- Can be integrated into existing Express applications
- Uses axios for HTTP requests instead of curl
- Same functionality as PHP implementation

**Configuration:**
Environment variables (both implementations):
- `MJPIN_PINTEREST_CLIENT_ID` - OAuth client ID
- `MJPIN_PINTEREST_CLIENT_SECRET` - OAuth client secret
- `MJPIN_PINTEREST_REDIRECT_URI` - Callback URL

**Security:**
- State parameter validates Discord user ID
- HTTPS required for production callback URL
- Access tokens stored locally in `data/pinterest_tokens.json` only
