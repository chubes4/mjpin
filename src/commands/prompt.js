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
    const result = await generatePrompt(input);
    await interaction.reply(result);
  } catch (err) {
    await interaction.reply(`Error: ${err.message}`);
  }
}

module.exports = {
  data,
  execute,
}; 