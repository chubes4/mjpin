require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const pinCommand = require('./commands/pin');
const promptCommand = require('./commands/prompt');
const syncCommand = require('./commands/sync');
const authCommand = require('./commands/auth');
const settingsCommand = require('./commands/settings');
const restartCommand = require('./commands/restart');
const editPromptCommand = require('./commands/editprompt');
const modelCommand = require('./commands/model');

// Load environment variables
const DISCORD_TOKEN = process.env.MJPIN_DISCORD_TOKEN;
const GUILD_ID = process.env.MJPIN_DISCORD_GUILD_ID;
const CLIENT_ID = process.env.MJPIN_DISCORD_CLIENT_ID;

// Debug log to verify .env loading
console.log('Loaded from .env:', {
  CLIENT_ID,
  DISCORD_TOKEN: DISCORD_TOKEN ? '[HIDDEN]' : undefined,
  GUILD_ID
});

// Global error handlers to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // For uncaught exceptions, we should exit gracefully
  process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (client) {
    client.destroy();
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (client) {
    client.destroy();
  }
  process.exit(0);
});

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register slash commands on startup
client.once(Events.ClientReady, async () => {
  console.log(`mjpin bot is online as ${client.user.tag}`);
  
  // Signal PM2 that we're ready (if using PM2)
  if (process.send) {
    process.send('ready');
  }
  
  // Register all commands for the guild
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [
        pinCommand.data.toJSON(), 
        promptCommand.data.toJSON(), 
        syncCommand.data.toJSON(), 
        authCommand.data.toJSON(),
        settingsCommand.data.toJSON(),
        restartCommand.data.toJSON(),
        editPromptCommand.data.toJSON(),
        modelCommand.data.toJSON(),
      ] }
    );
    console.log('Registered /pin, /prompt, /sync, /auth, /settings, /restart, /editprompt, and /model commands');

    // Handle restart confirmation
    const restartFilePath = path.join(__dirname, '..', 'data', 'restart_info.json');
    console.log('Checking for restart file at:', restartFilePath);
    if (fs.existsSync(restartFilePath)) {
      console.log('Found restart file, processing...');
      try {
        const restartInfo = JSON.parse(fs.readFileSync(restartFilePath, 'utf8'));
        console.log('Restart info loaded:', restartInfo);
        const channel = await client.channels.fetch(restartInfo.channelId);
        console.log('Channel fetched:', channel.id);
        const message = await channel.messages.fetch(restartInfo.messageId);
        console.log('Message fetched:', message.id);
        await message.edit('Restart successful! ✅');
        console.log('Message updated successfully');
        fs.unlinkSync(restartFilePath);
        console.log('Restart file cleaned up');
      } catch (error) {
        console.error('Error handling restart info:', error);
        console.error('Error stack:', error.stack);
      }
    } else {
      console.log('No restart file found');
    }
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
  // Don't crash on client errors, just log them
});

client.on(Events.Disconnect, (event) => {
  console.log('Discord client disconnected:', event);
});

client.on(Events.Reconnecting, () => {
  console.log('Discord client reconnecting...');
});

client.on(Events.Resume, () => {
  console.log('Discord client resumed connection');
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // Handle select menu for /editprompt section selection
  if (interaction.isStringSelectMenu() && interaction.customId === 'editprompt-section-select') {
    await editPromptCommand.handleSectionSelect(interaction);
    return;
  }

  // Handle modal submissions for /editprompt
  if (interaction.type === 5 && interaction.customId.startsWith('editprompt-modal-')) {
    await editPromptCommand.handleModalSubmit(interaction);
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  
  try {
    if (interaction.commandName === 'pin') {
      await pinCommand.execute(interaction);
    } else if (interaction.commandName === 'prompt') {
      await promptCommand.execute(interaction);
    } else if (interaction.commandName === 'sync') {
      await syncCommand.execute(interaction);
    } else if (interaction.commandName === 'auth') {
      await authCommand.execute(interaction);
    } else if (interaction.commandName === 'settings') {
      await settingsCommand.execute(interaction);
    } else if (interaction.commandName === 'restart') {
      await restartCommand.execute(interaction);
    } else if (interaction.commandName === 'editprompt') {
      await editPromptCommand.execute(interaction);
    } else if (interaction.commandName === 'model') {
      await modelCommand.execute(interaction);
    }
  } catch (commandError) {
    console.error(`Error executing ${interaction.commandName} command:`, commandError);
    
    // Try to respond to the user about the error
    try {
      const errorMessage = 'There was an error executing this command. Please try again.';
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: errorMessage, flags: 64 });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.followUp({ content: errorMessage, flags: 64 });
      }
    } catch (responseError) {
      console.error('Error responding to interaction error:', responseError);
    }
  }
});

// Login with retry logic
async function loginWithRetry(maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await client.login(DISCORD_TOKEN);
      break;
    } catch (error) {
      retries++;
      console.error(`Login attempt ${retries} failed:`, error);
      
      if (retries >= maxRetries) {
        console.error('Max login retries reached. Exiting...');
        process.exit(1);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying login in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

loginWithRetry();
