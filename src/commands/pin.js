const { SlashCommandBuilder } = require('discord.js');
const { pinImageToBoard, getActiveAccount, getBoardsForAccount } = require('../services/pinterest');
const path = require('path');
const {
  MAX_PINS_PER_12H,
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
      .setDescription('Destination URL for the pin (required)')
      .setRequired(true)
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
  await interaction.deferReply(); // Defer the reply immediately

  const board = interaction.options.getString('board');
  const url = interaction.options.getString('url');
  const messageIds = [];
  for (let i = 1; i <= 10; i++) {
    const id = interaction.options.getString(`message_id_${i}`);
    if (id) messageIds.push(id);
  }
  if (messageIds.length === 0) {
    await interaction.editReply('You must provide at least one message ID.');
    return;
  }

  // Get the active Pinterest account
  const activeAccount = await getActiveAccount(interaction.user.id);
  if (!activeAccount) {
    await interaction.editReply('You must authenticate with Pinterest first using `/auth`, then select an active account using `/settings`.');
    return;
  }

  // Get boards for the active account
  const userBoards = await getBoardsForAccount(activeAccount.pinterestUserId);
  if (!userBoards || userBoards.length === 0) {
    await interaction.editReply(`No boards found for account "${activeAccount.accountName}". Please run \`/sync\` first.`);
    return;
  }

  // Find board by name (case-insensitive)
  const boardObj = userBoards.find(b => b.name.toLowerCase() === board.toLowerCase());
  if (!boardObj) {
    const available = userBoards.map(b => b.name).join(', ') || 'No boards found. Run /sync first.';
    await interaction.editReply(`Board "${board}" not found for account "${activeAccount.accountName}". Available boards: ${available}`);
    return;
  }
  const boardId = boardObj.id;

  // --- PIN RATE LIMIT CHECK ---
  // Use the Pinterest account ID as the key for rate limiting
  const accountId = activeAccount.pinterestUserId;
  const now = Date.now();
  let pinCount = await getRecentPinCount(accountId, now);
  if (pinCount >= MAX_PINS_PER_12H) {
    await interaction.editReply(`Pin limit reached for account "${activeAccount.accountName}" (${MAX_PINS_PER_12H} pins per 12 hours). Try again later.`);
    return;
  }

  const results = [];
  let pinsMade = 0;
  for (const messageId of messageIds) {
    // Check rate limit before each pin
    pinCount = await getRecentPinCount(accountId, Date.now());
    if (pinCount >= MAX_PINS_PER_12H) {
      results.push(`Pin limit reached (${MAX_PINS_PER_12H}/12h). Skipped remaining pins.`);
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
      const pinResult = await pinImageToBoard(boardId, imageUrl, url, activeAccount.accessToken);
      if (pinResult.success) {
        await recordPin(accountId, Date.now());
        const countAfter = await getRecentPinCount(accountId, Date.now());
        results.push(`Message ${messageId}: Pinned successfully to "${activeAccount.accountName}".\n12-hour pin count: ${countAfter}/${MAX_PINS_PER_12H}`);
        pinsMade++;
      } else {
        results.push(`Message ${messageId}: Failed to pin (${pinResult.error || 'unknown error'}).`);
      }
    } catch (err) {
      results.push(`Message ${messageId}: Error - ${err.message}`);
    }
  }
  await interaction.editReply(results.join('\n'));
}

module.exports = {
  data,
  execute,
};
