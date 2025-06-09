const { SlashCommandBuilder } = require('discord.js');
const { pinImageToBoard } = require('../services/pinterest');
const path = require('path');
const {
  MAX_PINS_PER_24H,
  getRecentPinCount,
  recordPin
} = require('../utils/pinRateLimit');

// Command registration data
const data = new SlashCommandBuilder()
  .setName('pin')
  .setDescription('Pin images to a Pinterest board from message IDs')
  .addStringOption(option =>
    option.setName('board')
      .setDescription('Pinterest board name.')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('message_id_1')
      .setDescription('Discord message ID #1')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('url')
      .setDescription('Destination URL for the pin')
      .setRequired(false)
  );
// Add up to 9 more optional message_id options (message_id_2 to message_id_10)
for (let i = 2; i <= 10; i++) {
  data.addStringOption(option =>
    option.setName(`message_id_${i}`)
      .setDescription(`Discord message ID #${i}`)
      .setRequired(false)
  );
}

// Command handler
async function execute(interaction) {
  const board = interaction.options.getString('board');
  const url = interaction.options.getString('url');
  const messageIds = [];
  for (let i = 1; i <= 10; i++) {
    const id = interaction.options.getString(`message_id_${i}`);
    if (id) messageIds.push(id);
  }
  if (messageIds.length === 0) {
    await interaction.reply('You must provide at least one message ID.');
    return;
  }
  // Load user access token
  const fs = require('fs');
  const tokens = fs.existsSync('src/services/pinterest_tokens.json') ? JSON.parse(fs.readFileSync('src/services/pinterest_tokens.json', 'utf8')) : {};
  const accessToken = tokens[interaction.user.id];
  if (!accessToken) {
    await interaction.reply('You must authenticate with Pinterest first using /auth.');
    return;
  }
  // Load boards for this user
  let boardsJson = {};
  try {
    boardsJson = JSON.parse(fs.readFileSync('boards.json', 'utf8'));
  } catch (e) {}
  // Get Pinterest account ID for this user (assume only one for now)
  const userBoards = Object.values(boardsJson)[0] || [];
  // Find board by name (case-insensitive)
  const boardObj = userBoards.find(b => b.name.toLowerCase() === board.toLowerCase());
  if (!boardObj) {
    const available = userBoards.map(b => b.name).join(', ') || 'No boards found. Run /sync first.';
    await interaction.reply(`Board "${board}" not found. Available boards: ${available}`);
    return;
  }
  const boardId = boardObj.id;

  // --- PIN RATE LIMIT CHECK ---
  // Use the Pinterest account ID as the key for rate limiting
  const accountId = Object.keys(boardsJson)[0];
  const now = Date.now();
  let pinCount = getRecentPinCount(accountId, now);
  if (pinCount >= MAX_PINS_PER_24H) {
    await interaction.reply(`Pin limit reached for this account (${MAX_PINS_PER_24H} pins per 24 hours). Try again later.`);
    return;
  }

  const results = [];
  let pinsMade = 0;
  for (const messageId of messageIds) {
    // Check rate limit before each pin
    pinCount = getRecentPinCount(accountId, Date.now());
    if (pinCount >= MAX_PINS_PER_24H) {
      results.push(`Pin limit reached (${MAX_PINS_PER_24H}/24h). Skipped remaining pins.`);
      break;
    }
    try {
      const message = await interaction.channel.messages.fetch(messageId);
      let imageUrl = null;
      if (message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
      } else if (message.embeds.length > 0 && message.embeds[0].image) {
        imageUrl = message.embeds[0].image.url;
      }
      if (!imageUrl) {
        results.push(`Message ${messageId}: No image found.`);
        continue;
      }
      const pinResult = await pinImageToBoard(boardId, imageUrl, url, accessToken);
      if (pinResult.success) {
        recordPin(accountId, Date.now());
        const countAfter = getRecentPinCount(accountId, Date.now());
        results.push(`Message ${messageId}: Pinned successfully.\n24 hour pin count: ${countAfter}/${MAX_PINS_PER_24H}`);
        pinsMade++;
      } else {
        results.push(`Message ${messageId}: Failed to pin (${pinResult.error || 'unknown error'}).`);
      }
    } catch (err) {
      results.push(`Message ${messageId}: Error - ${err.message}`);
    }
  }
  await interaction.reply(results.join('\n'));
}

module.exports = {
  data,
  execute,
};
