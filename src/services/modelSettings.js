/**
 * Per-guild OpenAI model selection storage
 */
const { readJsonFile, writeJsonFile } = require('../utils/jsonFileManager');

const STORE_FILE = 'model_settings.json';

async function getModelForGuild(guildId) {
  if (!guildId) return null;
  const store = await readJsonFile(STORE_FILE, {});
  return store[guildId] || null;
}

async function setModelForGuild(guildId, modelId) {
  if (!guildId || !modelId) throw new Error('guildId and modelId are required');
  const store = await readJsonFile(STORE_FILE, {});
  store[guildId] = modelId;
  await writeJsonFile(STORE_FILE, store);
  return true;
}

module.exports = {
  getModelForGuild,
  setModelForGuild,
};
