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
    const result = await generatePrompt(input);
    const MAX_DISCORD_MESSAGE_LENGTH = 2000;
    const safeResult = result.length > MAX_DISCORD_MESSAGE_LENGTH
      ? result.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 3) + '...'
      : result;
    await interaction.editReply(safeResult);
    return; // Prevent further code from running
  } catch (err) {
    try {
      await interaction.editReply(`Error: ${err.message}`);
    } catch (e) {
      // If editReply fails (e.g., already replied), log the error
      console.error('Failed to edit reply:', e);
    }
  }
}

module.exports = {
  data,
  execute,
}; 