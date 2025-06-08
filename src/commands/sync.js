const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Sync Pinterest boards for the connected account (admin only)');

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  console.log('SYNC COMMAND EXECUTED');
  // Admin-only: require MANAGE_GUILD permission
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    await interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  // Load user access token
  const tokens = fs.existsSync('src/services/pinterest_tokens.json') ? JSON.parse(fs.readFileSync('src/services/pinterest_tokens.json', 'utf8')) : {};
  const accessToken = tokens[interaction.user.id];
  if (!accessToken) {
    await interaction.reply('You must authenticate with Pinterest first using /auth.');
    return;
  }

  try {
    // Get user account info to use as key
    const userResp = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const accountId = userResp.data.id;
    // Fetch all boards with pagination
    let allBoards = [];
    let bookmark = null;
    do {
      const url = bookmark
        ? `https://api.pinterest.com/v5/boards?bookmark=${bookmark}`
        : 'https://api.pinterest.com/v5/boards';
      const boardsResp = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      allBoards = allBoards.concat(boardsResp.data.items);
      bookmark = boardsResp.data.bookmark;
    } while (bookmark);
    const boards = allBoards.map(b => ({
      id: b.id,
      name: b.name
    }));
    // Read or create boards.json
    let boardsJson = {};
    try {
      boardsJson = JSON.parse(fs.readFileSync('boards.json', 'utf8'));
    } catch (e) {}
    boardsJson[accountId] = boards;
    fs.writeFileSync('boards.json', JSON.stringify(boardsJson, null, 2));
    await interaction.editReply(`Synced ${boards.length} boards for account ${accountId}.`);
  } catch (err) {
    console.error('SYNC ERROR:', err);
    await interaction.editReply(`Error syncing boards: ${err.message}`);
  }
}

module.exports = {
  data,
  execute,
}; 