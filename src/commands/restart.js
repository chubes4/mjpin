const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('Restarts the bot (admin only)');

async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to restart the bot.', ephemeral: true });
    return;
  }

  const reply = await interaction.reply({ content: 'Restarting bot...', fetchReply: true });

  const restartInfo = {
    channelId: interaction.channelId,
    messageId: reply.id,
    timestamp: Date.now()
  };

  const restartFilePath = path.join(__dirname, '../../data/restart_info.json');
  fs.writeFileSync(restartFilePath, JSON.stringify(restartInfo, null, 2));

  setTimeout(() => process.exit(0), 500);
}

module.exports = { data, execute }; 