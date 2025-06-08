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
  );
// Add up to 10 message_id options
for (let i = 1; i <= 10; i++) {
  data.addStringOption(option =>
    option.setName(`message_id_${i}`)
      .setDescription(`Discord message ID #${i}`)
      .setRequired(i === 1) // Only the first is required
  );
}

// Command handler
async function execute(interaction) {
  const board = interaction.options.getString('board');
  const messageIds = [];
  for (let i = 1; i <= 10; i++) {
    const id = interaction.options.getString(`message_id_${i}`);
    if (id) messageIds.push(id);
  }
  if (messageIds.length === 0) {
    await interaction.reply('You must provide at least one message ID.');
    return;
  }

  const results = [];
  for (const messageId of messageIds) {
    try {
      // Fetch the message from the same channel
      const message = await interaction.channel.messages.fetch(messageId);
      // Try to get the first image URL from attachments or embeds
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
      // Call Pinterest service (placeholder)
      const pinResult = await pinImageToBoard(board, imageUrl);
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
