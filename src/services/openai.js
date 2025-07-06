const axios = require('axios');
const { readTextFile } = require('../utils/jsonFileManager');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

let SYSTEM_PROMPT = '';

async function loadSystemPrompt() {
  try {
    const instructionsPath = path.join(__dirname, '../../data/system_prompt_instructions.txt');
    const wordbanksPath = path.join(__dirname, '../../data/system_prompt_word_banks.txt');
    const [instructions, wordbanks] = await Promise.all([
      fs.readFile(instructionsPath, 'utf8').catch(() => ''),
      fs.readFile(wordbanksPath, 'utf8').catch(() => ''),
    ]);
    SYSTEM_PROMPT = instructions + '\n\n' + wordbanks;
  } catch (err) {
    console.warn('Could not load system prompt files:', err);
    SYSTEM_PROMPT = process.env.MJPIN_OPENAI_SYSTEM_PROMPT || 'You are a helpful AI that generates Midjourney prompts.';
  }
}

// Initialize system prompt on module load
loadSystemPrompt();

const OPENAI_API_KEY = process.env.MJPIN_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.MJPIN_OPENAI_MODEL || 'gpt-3.5-turbo';

// Note: Discord requires a reply within 15 seconds. For long generations, use deferred replies.
async function generatePrompt(input) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not set in environment.');
  }

  // Ensure system prompt is loaded
  if (!SYSTEM_PROMPT) {
    await loadSystemPrompt();
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const data = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: input }
    ],
    temperature: 0.8
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
};
