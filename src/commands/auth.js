const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const PINTEREST_CLIENT_ID = process.env.MJPIN_PINTEREST_CLIENT_ID;
const PINTEREST_REDIRECT_URI = process.env.MJPIN_PINTEREST_REDIRECT_URI;

const data = new SlashCommandBuilder()
  .setName('auth')
  .setDescription('Authenticate with Pinterest to allow the bot to pin on your behalf.');

async function execute(interaction) {
  const scopes = [
    'boards:read',
    'boards:write',
    'pins:read',
    'pins:write',
    'user_accounts:read'
  ].join(',');

  const authUrl = `https://www.pinterest.com/oauth/?response_type=code&client_id=${PINTEREST_CLIENT_ID}&redirect_uri=${encodeURIComponent(PINTEREST_REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}&state=${interaction.user.id}`;

  await interaction.reply({
    content: `Click the link below to authenticate with Pinterest:\n${authUrl}\n\nAfter authorizing, you'll be redirected to the callback URL. The bot will complete the process automatically.`,
    ephemeral: true
  });
}

module.exports = {
  data,
  execute,
}; 