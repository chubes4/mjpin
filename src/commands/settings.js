const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
const { getAllAccounts, getActiveAccount, setActiveAccount } = require('../services/pinterest');

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
      await interaction.editReply({
        content: `You have one Pinterest account linked: **${allAccounts[0].accountName}**\n\nThis account is automatically active. Use \`/auth\` to link additional accounts.`,
      });
      return;
    }
    
    // Multiple accounts - show dropdown for selection
    const options = allAccounts.map(account => 
      new StringSelectMenuOptionBuilder()
        .setLabel(account.accountName)
        .setValue(account.pinterestUserId)
        .setDescription(account.pinterestUserId === activeAccount?.pinterestUserId ? '✓ Currently active' : 'Click to set as active')
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
      console.log('Settings: Waiting for component interaction...');
      const confirmation = await reply.awaitMessageComponent({ 
        filter: i => i.user.id === interaction.user.id && i.customId === 'select_active_pinterest_account', 
        time: 60000, 
        componentType: ComponentType.StringSelect,
      });
      
      console.log('Settings: Component interaction received, processing...');
      const selectedPinterestUserId = confirmation.values[0];
      console.log(`Settings: Selected Pinterest user ID: ${selectedPinterestUserId}`);
      
      const success = await setActiveAccount(discordUserId, selectedPinterestUserId);
      console.log(`Settings: setActiveAccount result: ${success}`);
      
      if (success) {
        const selectedAccount = allAccounts.find(acc => acc.pinterestUserId === selectedPinterestUserId);
        console.log(`Settings: Switching to account: ${selectedAccount?.accountName}`);
        await confirmation.update({ 
          content: `✅ **Account switched successfully!**\n\nYour active Pinterest account is now: **${selectedAccount.accountName}**\n\nAll \`/pin\` and \`/sync\` commands will now use this account.`, 
          components: [] 
        });
      } else {
        console.log('Settings: setActiveAccount returned false');
        await confirmation.update({ 
          content: '❌ Failed to switch accounts. Please try again.', 
          components: [] 
        });
      }
      
    } catch (componentError) {
      console.error('Settings component interaction error:', componentError);
      console.error('Error name:', componentError.name);
      console.error('Error message:', componentError.message);
      
      // Check if the interaction has already been acknowledged/replied to
      if (interaction.replied || interaction.deferred) {
        // Use followUp for already acknowledged interactions
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