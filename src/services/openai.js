const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

let SYSTEM_PROMPT;
try {
  SYSTEM_PROMPT = fs.readFileSync('system_prompt.txt', 'utf8');
} catch (err) {
  SYSTEM_PROMPT = process.env.MJPIN_OPENAI_SYSTEM_PROMPT || 'You are a helpful AI that generates Midjourney prompts.';
}

const OPENAI_API_KEY = process.env.MJPIN_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.MJPIN_OPENAI_MODEL || 'gpt-3.5-turbo';

async function generatePrompt(input) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not set in environment.');
  }

  const url = 'https://api.openai.com/v1/chat/completions';
  const data = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: input }
    ],
    max_tokens: 200,
    temperature: 0.8
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
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
