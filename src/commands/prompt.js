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
  await interaction.deferReply();
  const result = await generatePrompt(input, interaction.guildId);
    const MAX_DISCORD_MESSAGE_LENGTH = 2000;
    const safeResult = result.length > MAX_DISCORD_MESSAGE_LENGTH
      ? result.slice(0, MAX_DISCORD_MESSAGE_LENGTH - 3) + '...'
      : result;
    await interaction.editReply(safeResult);
    return;
  } catch (err) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(`Error: ${err.message}`);
      } else {
        await interaction.editReply(`Error: ${err.message}`);
      }
    } catch (e) {
      console.error('Failed to send error message to user:', e);
      console.error('Original error that caused this:', err);
    }
  }
}

module.exports = {
  data,
  execute,
}; 