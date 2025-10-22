# Rate Limiting System

Sliding window rate limiting for Pinterest API compliance (100 pins per 12 hours per account).

## Rate Limit Specification

**Pinterest API limit:**
100 pins per 12 hours per account (enforced by Pinterest)

**Bot implementation:**
Proactive tracking to prevent API rejections.

**Window duration:**
12 hours = 43,200,000 milliseconds

**Scope:**
Per Pinterest account (not per Discord user)

## Sliding Window Algorithm

**Timestamp tracking:**
Array of Unix milliseconds for each successful pin.

**Window calculation:**
1. Get current time: `Date.now()`
2. Calculate cutoff: `current_time - 43,200,000ms`
3. Filter timestamps: Keep only timestamps > cutoff
4. Count remaining timestamps
5. Compare count to limit (100)

**Pin recording:**
1. Filter old timestamps (>12 hours)
2. Add new timestamp to array
3. Save updated array to storage

**Automatic cleanup:**
Old timestamps removed during every read operation.

## Implementation Details

**Utility module:** `src/utils/pinRateLimit.js`

**Core functions:**
- `getRecentPinCount(accountId, now)` - Returns count of pins in last 12 hours
- `recordPin(accountId, now)` - Records new pin timestamp

**Storage:**
data/pin_counts.json - Arrays of timestamps keyed by Pinterest user ID

**Timestamp precision:**
Millisecond precision using `Date.now()`

## Rate Limit Checks

**Pre-flight check:**
Before processing pin batch:
1. Get current pin count for active account
2. If count >= 100: Reject entire batch with error message
3. If count < 100: Proceed with batch

**Per-pin check:**
Before each individual pin in batch:
1. Get current pin count
2. If count >= 100: Stop processing, return limit message
3. If count < 100: Process pin, record if successful

**Post-pin update:**
After successful pin:
1. Record pin timestamp
2. Get updated count
3. Return count in success message: "12-hour pin count: X/100"

## Multi-Account Rate Limits

**Account isolation:**
Each Pinterest account maintains separate rate limit.

**Account switching:**
User switches accounts via `/settings` when limit reached.

**Display in /settings:**
Shows per-account pin count: "12-hour pins: X/100"

**Use case:**
User has 3 Pinterest accounts. Account A reaches 100 pins. User switches to Account B to continue pinning while Account A's window expires.

## Rate Limit Enforcement

**Batch processing:**
`/pin` command can specify up to 10 message IDs.

**Enforcement points:**
1. Before starting batch: Check if any capacity remaining
2. Before each pin: Check if capacity available
3. Stop immediately when limit reached: Skip remaining pins in batch

**User notification:**
- "Pin limit reached (100/12h). Skipped remaining pins."
- Shows which pins succeeded before limit
- Shows count after each successful pin

## Edge Cases

**Multiple simultaneous pins:**
No locking mechanism. Possible race condition if user runs multiple `/pin` commands simultaneously. Rare in practice due to deferred reply patterns.

**Clock changes:**
System clock changes affect window calculation. Forward clock change may prematurely expire timestamps. Backward clock change may extend window.

**Account deletion:**
Rate limit data persists even if Pinterest account unlinked. No cleanup mechanism.

**Timestamp overflow:**
JavaScript Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991 (year 287396). No overflow concern.

## Rate Limit Display

**Format:**
"12-hour pins: X/100" where X = current count

**Display locations:**
- After each successful pin in `/pin` command
- In `/settings` command for all accounts
- In account switching confirmation

**Real-time updates:**
Count recalculated on every read operation, always reflects current window.

## Window Expiration

**No scheduled cleanup:**
Timestamps removed only during read operations.

**Effective expiration:**
Pin becomes available for counting 12 hours after recording.

**Example:**
- Pin recorded at 12:00 PM Monday
- Still counts until 12:00 AM Tuesday
- At 12:01 AM Tuesday, no longer counts
- User regains 1 pin of capacity

**Window rolling:**
As old pins expire, new capacity becomes available continuously, not in batches.

## Performance Considerations

**Storage size:**
Maximum 100 timestamps per account × 8 bytes per timestamp = 800 bytes per account.

**Read frequency:**
- Every `/pin` command: 1 read before batch + 1 read per pin
- Every `/settings` command: 1 read per account

**Write frequency:**
- 1 write per successful pin

**Optimization:**
No optimization needed. File operations negligible for small data sizes.
