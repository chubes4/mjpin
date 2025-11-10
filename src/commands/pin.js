const { SlashCommandBuilder } = require('discord.js');
const { pinImageToBoard, getActiveAccount, getBoardsForAccount } = require('../services/pinterest');
const { extractImageMessageIds, findLastPinCommand } = require('../utils/messageSearch');
const {
  MAX_PINS_PER_12H,
  getRecentPinCount,
  recordPin
} = require('../utils/pinRateLimit');

const data = new SlashCommandBuilder()
  .setName('pin')
  .setDescription('Pin images to Pinterest using keyword search')
  .addStringOption(option =>
    option.setName('keyword')
      .setDescription('Keyword to search for images')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('url')
      .setDescription('Destination URL for the pin')
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName('board')
      .setDescription('Optional board name to pin to (defaults to keyword)')
      .setRequired(false)
  );

async function execute(interaction) {
  await interaction.deferReply();

  const keyword = interaction.options.getString('keyword');
  const url = interaction.options.getString('url');
  const boardOverride = interaction.options.getString('board');

  const channel = interaction.channel;
  const lastPinMessage = await findLastPinCommand(channel);

  let searchDescription = '';
  if (lastPinMessage) {
    const pinDate = lastPinMessage.createdAt.toLocaleString();
    searchDescription = `Searching for "${keyword}" images after last /pin command (${pinDate})...`;
  } else {
    searchDescription = `No previous /pin command found. Searching recent "${keyword}" images...`;
  }

  await interaction.editReply(searchDescription);

  const messageIds = await extractImageMessageIds(channel, keyword, lastPinMessage, 10);

  if (messageIds.length === 0) {
    await interaction.editReply(`No images found matching "${keyword}".`);
    return;
  }

  await interaction.editReply(`Found ${messageIds.length} matching image${messageIds.length === 1 ? '' : 's'} for "${keyword}". Starting to pin...`);

  const effectiveBoard = boardOverride || keyword;

  const activeAccount = await getActiveAccount(interaction.user.id);
  if (!activeAccount) {
    await interaction.editReply('You must authenticate with Pinterest first using `/auth`, then select an active account using `/settings`.');
    return;
  }

  const userBoards = await getBoardsForAccount(activeAccount.pinterestUserId);
  if (!userBoards || userBoards.length === 0) {
    await interaction.editReply(`No boards found for account "${activeAccount.accountName}". Please run \`/sync\` first.`);
    return;
  }

  const boardObj = userBoards.find(b => b.name.toLowerCase() === effectiveBoard.toLowerCase());
  if (!boardObj) {
    const available = userBoards.map(b => b.name).join(', ') || 'No boards found. Run /sync first.';
    await interaction.editReply(`Board "${effectiveBoard}" not found for account "${activeAccount.accountName}". Available boards: ${available}`);
    return;
  }
  const boardId = boardObj.id;

  const accountId = activeAccount.pinterestUserId;

  const results = [];
  for (const messageId of messageIds) {
    const now = Date.now();
    let pinCount = await getRecentPinCount(accountId, now);
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
        results.push(`Message ${messageId}: Pinned successfully to board "${boardObj.name}" (account "${activeAccount.accountName}").\n12-hour pin count: ${countAfter}/${MAX_PINS_PER_12H}`);
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
