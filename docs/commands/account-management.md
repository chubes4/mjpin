# Account Management Commands

Commands for Pinterest authentication, board synchronization, and account switching.

## /auth

Generates Pinterest OAuth2 authorization URL for account linking.

**Parameters:** None

**What it does:**
- Generates Pinterest OAuth URL with required scopes
- Includes Discord user ID as state parameter for callback matching
- Returns authorization link as ephemeral message (visible only to user)

**OAuth scopes requested:**
- `boards:read` - Read Pinterest board information
- `boards:write` - Create and modify boards
- `pins:read` - Read pin information
- `pins:write` - Create pins
- `user_accounts:read` - Read user account information

**Authorization flow:**
1. User clicks authorization URL
2. Pinterest prompts for permission
3. User grants access
4. Pinterest redirects to callback URL with authorization code
5. Bot exchanges code for access token automatically
6. Account saved with format: `username (first8chars_of_pinterest_id)`

**Multi-account support:**
- Users can link multiple Pinterest accounts
- Each account tracked separately by Pinterest user ID
- First linked account automatically set as active
- Additional accounts added via subsequent `/auth` commands

**Account data stored:**
- Access token (bearer token for API requests)
- Pinterest user ID (unique identifier)
- Account name (username + ID prefix)
- Creation timestamp

## /sync

Fetches and caches Pinterest boards for currently active account.

**Parameters:** None

**Permission:** Requires Manage Server permission

**What it does:**
- Fetches all boards from Pinterest API for active account
- Handles pagination with bookmark-based iteration
- Caches board IDs and names in local storage
- Returns count of synchronized boards

**Board data cached:**
- Board ID (Pinterest API identifier)
- Board name (user-visible label)

**Pagination:**
- Fetches 100 boards per API request
- Continues with bookmark token until all boards retrieved
- Rate limited to prevent API throttling (100ms delay between requests)

**Prerequisites:**
- Must authenticate via `/auth` first
- Must have active account selected via `/settings`

**Error handling:**
- No active account: Prompts authentication and account selection
- API errors: Returns sanitized error message with account name

**Use case:**
After linking Pinterest account, user must sync boards before pinning. Board names used in `/pin` command must match exactly (case-insensitive).

## /settings

Views and manages Pinterest account settings.

**Parameters:** None

**What it does:**
- Displays all linked Pinterest accounts for Discord user
- Shows 12-hour pin count for each account
- Allows switching between accounts via dropdown menu
- Returns rate limit status for active account

**Display modes:**

**No accounts linked:**
- Prompts user to run `/auth`

**Single account:**
- Shows account name
- Shows current 12-hour pin count vs limit (100)
- Indicates account automatically active
- Suggests `/auth` to link additional accounts

**Multiple accounts:**
- Lists all accounts with pin counts
- Indicates currently active account with checkmark
- Provides dropdown menu for account switching
- Shows per-account rate limit status

**Account switching:**
- User selects account from dropdown
- Selection times out after 60 seconds
- Updates active account immediately on selection
- All subsequent `/pin` and `/sync` commands use new active account

**Rate limit display:**
Format: `12-hour pins: X/100`
- Shows pins made in last 12 hours for each account
- Updates in real-time during switching

**Use case:**
User has multiple Pinterest accounts for different content types. Switches between accounts to distribute pins across rate limits or organize content by account.
