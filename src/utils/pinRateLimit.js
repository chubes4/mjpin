const fs = require('fs');
const path = require('path');

const PIN_COUNTS_FILE = path.join(__dirname, '../../pin_counts.json');
const MAX_PINS_PER_24H = 100;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function loadPinCounts() {
  if (!fs.existsSync(PIN_COUNTS_FILE)) return {};
  return JSON.parse(fs.readFileSync(PIN_COUNTS_FILE, 'utf8'));
}

function savePinCounts(counts) {
  fs.writeFileSync(PIN_COUNTS_FILE, JSON.stringify(counts, null, 2));
}

function getRecentPinCount(accountId, now = Date.now()) {
  const counts = loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  return timestamps.length;
}

function recordPin(accountId, now = Date.now()) {
  const counts = loadPinCounts();
  const timestamps = (counts[accountId] || []).filter(ts => now - ts < WINDOW_MS);
  timestamps.push(now);
  counts[accountId] = timestamps;
  savePinCounts(counts);
}

module.exports = {
  MAX_PINS_PER_24H,
  getRecentPinCount,
  recordPin,
}; 