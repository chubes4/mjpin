const { readJsonFile, writeJsonFile } = require('./jsonFileManager');

const PIN_COUNTS_FILE = 'pin_counts.json';
const MAX_PINS_PER_12H = 100;
const WINDOW_MS = 12 * 60 * 60 * 1000;

/**
 * Load pin count timestamps from storage
 * @returns {Promise<Object>} Pin counts by account ID
 */
async function loadPinCounts() {
  try {
    return await readJsonFile(PIN_COUNTS_FILE);
  } catch (error) {
    console.error('Error loading pin counts:', error);
    return {};
  }
}

/**
 * Save pin count timestamps to storage
 * @param {Object} counts - Pin counts by account ID
 */
async function savePinCounts(counts) {
  try {
    await writeJsonFile(PIN_COUNTS_FILE, counts);
  } catch (error) {
    console.error('Error saving pin counts:', error);
    throw error;
  }
}

/**
 * Get count of pins within the rate limit window
 * @param {string} accountId - Pinterest account ID
 * @param {number} now - Current timestamp
 * @returns {Promise<number>} Number of recent pins
 */
async function getRecentPinCount(accountId, now = Date.now()) {
  const counts = await loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  return timestamps.length;
}

/**
 * Record a new pin timestamp for rate limiting
 * @param {string} accountId - Pinterest account ID
 * @param {number} now - Pin timestamp
 */
async function recordPin(accountId, now = Date.now()) {
  const counts = await loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  timestamps.push(now);
  counts[accountId] = timestamps;
  await savePinCounts(counts);
}

module.exports = {
  MAX_PINS_PER_12H,
  getRecentPinCount,
  recordPin,
}; 