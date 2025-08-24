const axios = require('axios');
const { readTextFile } = require('../utils/jsonFileManager');
const { getModelForGuild } = require('./modelSettings');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

let SYSTEM_PROMPT = '';

async function loadSystemPrompt() {
  try {
    const dataDir = path.join(__dirname, '../../data');
    const files = await fs.readdir(dataDir);
    const txtFiles = files.filter(file => file.endsWith('.txt'));
    
    const prompts = await Promise.all(
      txtFiles.map(file => {
        const filePath = path.join(dataDir, file);
        return fs.readFile(filePath, 'utf8').catch(err => {
          console.warn(`Could not read prompt file: ${file}`, err);
          return '';
        });
      })
    );

    SYSTEM_PROMPT = prompts.join('\n\n');

    if (!SYSTEM_PROMPT) {
      throw new Error('No prompt files could be read and no fallback was set.');
    }
    
  } catch (err) {
    console.warn('Could not load system prompt files:', err);
    SYSTEM_PROMPT = process.env.MJPIN_OPENAI_SYSTEM_PROMPT || 'You are a helpful AI that generates Midjourney prompts.';
  }
}

// Initialize system prompt on module load
loadSystemPrompt();

const OPENAI_API_KEY = process.env.MJPIN_OPENAI_API_KEY;

// Note: Discord requires a reply within 15 seconds. For long generations, use deferred replies.
// No default model: guild must set a model via /model
async function generatePrompt(input, guildId = null) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not set in environment.');
  }

  // Ensure system prompt is loaded
  if (!SYSTEM_PROMPT) {
    await loadSystemPrompt();
  }

  // Resolve model per guild; require explicit selection
  const modelId = guildId ? await getModelForGuild(guildId) : null;
  if (!modelId) {
    throw new Error('OpenAI model is not configured for this server. Ask an admin to run /model to set it.');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const data = {
    model: modelId,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: input }
    ]
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    const result = response.data.choices && response.data.choices[0]?.message?.content;
    if (result) {
      return result;
    } else {
      throw new Error('No response from OpenAI API.');
    }
  } catch (error) {
    let errMsg = error.response && error.response.data && error.response.data.error && error.response.data.error.message
      ? error.response.data.error.message
      : error.message;
    throw new Error(`OpenAI API error: ${errMsg}`);
  }
}

module.exports = {
  generatePrompt,
  loadSystemPrompt,
};
