const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

const data = new SlashCommandBuilder()
  .setName('restart')
  .setDescription('Restarts the bot (admin only)');

async function execute(interaction) {
  // Allow only users with Administrator permission
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to restart the bot.', ephemeral: true });
    return;
  }
  await interaction.reply('Restarting bot...');
  process.exit(0);
}

module.exports = { data, execute }; 