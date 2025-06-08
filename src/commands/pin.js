const { SlashCommandBuilder } = require('discord.js');
const { pinImageToBoard } = require('../services/pinterest');

// Command registration data
const data = new SlashCommandBuilder()
  .setName('pin')
  .setDescription('Pin images to a Pinterest board from message IDs')
  .addStringOption(option =>
    option.setName('board')
      .setDescription('Pinterest board slug (e.g., paper-crafts)')
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
  const results = [];
  for (const messageId of messageIds) {
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
        results.push(`Message ${messageId}: Pinned successfully.`);
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
