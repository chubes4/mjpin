const { SlashCommandBuilder } = require('discord.js');
const { generatePrompt } = require('../services/openai');

const data = new SlashCommandBuilder()
  .setName('prompt')
  .setDescription('Generate a Midjourney prompt using OpenAI')
  .addStringOption(option =>
    option.setName('input')
      .setDescription('Describe what you want to generate')
      .setRequired(true)
  );

async function execute(interaction) {
  const input = interaction.options.getString('input');
  try {
  await interaction.deferReply(); // Acknowledge immediately
  const result = await generatePrompt(input, interaction.guildId);
    const MAX_DISCORD_MESSAGE_LENGTH = 2000;
    const safeResult = result.length > MAX_DISCORD_MESSAGE_LENGTH
      ? result.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 3) + '...'
      : result;
    await interaction.editReply(safeResult);
    return; // Prevent further code from running
  } catch (err) {
    try {
      // Check if interaction is still valid before attempting to edit reply
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(`Error: ${err.message}`);
      } else {
        await interaction.editReply(`Error: ${err.message}`);
      }
    } catch (e) {
      // If reply/editReply fails (e.g., already replied), log the error but don't throw
      console.error('Failed to send error message to user:', e);
      console.error('Original error that caused this:', err);
    }
  }
}

module.exports = {
  data,
  execute,
}; 