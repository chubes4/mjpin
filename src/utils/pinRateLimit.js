const { readJsonFile, writeJsonFile } = require('./jsonFileManager');

const PIN_COUNTS_FILE = 'pin_counts.json';
const MAX_PINS_PER_24H = 150;
const WINDOW_MS = 24 * 60 * 60 * 1000;

async function loadPinCounts() {
  try {
    return await readJsonFile(PIN_COUNTS_FILE);
  } catch (error) {
    console.error('Error loading pin counts:', error);
    return {};
  }
}

async function savePinCounts(counts) {
  try {
    await writeJsonFile(PIN_COUNTS_FILE, counts);
  } catch (error) {
    console.error('Error saving pin counts:', error);
    throw error;
  }
}

async function getRecentPinCount(accountId, now = Date.now()) {
  const counts = await loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  return timestamps.length;
}

async function recordPin(accountId, now = Date.now()) {
  const counts = await loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  timestamps.push(now);
  counts[accountId] = timestamps;
  await savePinCounts(counts);
}

module.exports = {
  MAX_PINS_PER_24H,
  getRecentPinCount,
  recordPin,
}; 