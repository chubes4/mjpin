const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { getAllAccounts, getActiveAccount, setActiveAccount } = require('../services/pinterest');
const { getRecentPinCount, MAX_PINS_PER_12H } = require('../utils/pinRateLimit');

const data = new SlashCommandBuilder()
  .setName('settings')
  .setDescription('View and manage your Pinterest account settings');

async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  
  const discordUserId = interaction.user.id;
  
  try {
    const allAccounts = await getAllAccounts(discordUserId);
    const activeAccount = await getActiveAccount(discordUserId);
    
    if (allAccounts.length === 0) {
      await interaction.editReply({
        content: 'You have no Pinterest accounts linked. Use `/auth` to link your first account.',
      });
      return;
    }
    
    if (allAccounts.length === 1) {
      const dailyCount = await getRecentPinCount(allAccounts[0].pinterestUserId);
      await interaction.editReply({
        content: `You have one Pinterest account linked: **${allAccounts[0].accountName}**\n\n12-hour pins: ${dailyCount}/${MAX_PINS_PER_12H}\n\nThis account is automatically active. Use \`/auth\` to link additional accounts.`,
      });
      return;
    }
    
    const accountsWithCounts = await Promise.all(
      allAccounts.map(async (account) => {
        const dailyCount = await getRecentPinCount(account.pinterestUserId);
        return {
          ...account,
          dailyCount
        };
      })
    );
    
    const options = accountsWithCounts.map(account => 
      new StringSelectMenuOptionBuilder()
        .setLabel(account.accountName)
        .setValue(account.pinterestUserId)
        .setDescription(account.pinterestUserId === activeAccount?.pinterestUserId 
          ? `✓ Currently active - 12-hour pins: ${account.dailyCount}/${MAX_PINS_PER_12H}`
: `12-hour pins: ${account.dailyCount}/${MAX_PINS_PER_12H}`)
        .setDefault(account.pinterestUserId === activeAccount?.pinterestUserId)
    );
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_active_pinterest_account')
      .setPlaceholder('Choose which Pinterest account to use...')
      .addOptions(options);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    const activeAccountName = activeAccount ? activeAccount.accountName : 'None';
    
    const reply = await interaction.editReply({
      content: `**Pinterest Account Settings**\n\nYou have ${allAccounts.length} Pinterest accounts linked.\nCurrently active: **${activeAccountName}**\n\nSelect an account below to switch to it:`,
      components: [row],
    });
    
    try {
      const confirmation = await reply.awaitMessageComponent({
        filter: i => i.user.id === interaction.user.id && i.customId === 'select_active_pinterest_account',
        time: 60000,
        componentType: ComponentType.StringSelect,
      });

      const selectedPinterestUserId = confirmation.values[0];
      const success = await setActiveAccount(discordUserId, selectedPinterestUserId);

      if (success) {
        const selectedAccount = allAccounts.find(acc => acc.pinterestUserId === selectedPinterestUserId);
        await confirmation.update({
          content: `✅ **Account switched successfully!**\n\nYour active Pinterest account is now: **${selectedAccount.accountName}**\n\nAll \`/pin\` and \`/sync\` commands will now use this account.`,
          components: []
        });
      } else {
        await confirmation.update({
          content: '❌ Failed to switch accounts. Please try again.',
          components: []
        });
      }

    } catch (componentError) {
      console.error('Settings component interaction error:', componentError);

      if (interaction.replied || interaction.deferred) {
        if (componentError.code === 'INTERACTION_COLLECTOR_ERROR' || componentError.message.includes('time')) {
          try {
            await interaction.followUp({
              content: '⏰ Account selection timed out. Use `/settings` again to manage your accounts.',
              ephemeral: true
            });
          } catch (followUpError) {
            console.error('Failed to send followUp message:', followUpError);
          }
        } else {
          try {
            await interaction.followUp({
              content: `❌ Error switching accounts: ${componentError.message}. Please try again.`,
              ephemeral: true
            });
          } catch (followUpError) {
            console.error('Failed to send followUp error message:', followUpError);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Settings command error:', error);
    await interaction.editReply({
      content: `❌ Error loading account settings: ${error.message}`,
    });
  }
}

module.exports = {
  data,
  execute,
}; 