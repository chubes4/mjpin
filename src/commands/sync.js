const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const { getActiveAccount, saveBoardsForAccount } = require('../services/pinterest');
require('dotenv').config();

const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Sync Pinterest boards for the currently active account (admin only)');

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  console.log('SYNC COMMAND EXECUTED');
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    await interaction.editReply({ content: 'You do not have permission to use this command.', ephemeral: true });
    return;
  }

  const activeAccount = await getActiveAccount(interaction.user.id);
  if (!activeAccount) {
    await interaction.editReply('You must authenticate with Pinterest first using `/auth`, then select an active account using `/settings`.');
    return;
  }

  try {
    let allBoards = [];
    let bookmark = null;
    do {
      const url = bookmark
        ? `https://api.pinterest.com/v5/boards?bookmark=${bookmark}`
        : 'https://api.pinterest.com/v5/boards';
      const boardsResp = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${activeAccount.accessToken}`,
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
    
    await saveBoardsForAccount(activeAccount.pinterestUserId, boards);
    
    await interaction.editReply(`✅ **Sync complete!**\n\nSynced ${boards.length} boards for account "${activeAccount.accountName}".`);
  } catch (err) {
    console.error('SYNC ERROR:', err);
    await interaction.editReply(`❌ Error syncing boards for "${activeAccount.accountName}": ${err.message}`);
  }
}

module.exports = {
  data,
  execute,
}; 