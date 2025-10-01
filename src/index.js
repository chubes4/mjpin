/**
 * mjpin Discord bot - main entry point with command registration and interaction handling
 */
require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const pinCommand = require('./commands/pin');
const promptCommand = require('./commands/prompt');
const syncCommand = require('./commands/sync');
const authCommand = require('./commands/auth');
const settingsCommand = require('./commands/settings');
const restartCommand = require('./commands/restart');
const editPromptCommand = require('./commands/editprompt');
const modelCommand = require('./commands/model');
const gatherCommand = require('./commands/gather');

const DISCORD_TOKEN = process.env.MJPIN_DISCORD_TOKEN;
const GUILD_ID = process.env.MJPIN_DISCORD_GUILD_ID;
const CLIENT_ID = process.env.MJPIN_DISCORD_CLIENT_ID;

console.log('Loaded from .env:', {
  CLIENT_ID,
  DISCORD_TOKEN: DISCORD_TOKEN ? '[HIDDEN]' : undefined,
  GUILD_ID
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async () => {
  console.log(`mjpin bot is online as ${client.user.tag}`);

  if (process.send) {
    process.send('ready');
  }

  const restartFilePath = path.join(__dirname, '../data/restart_info.json');
  if (fs.existsSync(restartFilePath)) {
    try {
      const restartInfo = JSON.parse(fs.readFileSync(restartFilePath, 'utf8'));
      const channel = await client.channels.fetch(restartInfo.channelId);
      const message = await channel.messages.fetch(restartInfo.messageId);
      await message.edit('Restart successful.');
      fs.unlinkSync(restartFilePath);
      console.log('Updated restart message successfully');
    } catch (error) {
      console.error('Error updating restart message:', error);
      try {
        fs.unlinkSync(restartFilePath);
      } catch (unlinkError) {
        console.error('Error cleaning up restart file:', unlinkError);
      }
    }
  }

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
        gatherCommand.data.toJSON(),
      ] }
    );
    console.log('Registered /pin, /gather, /prompt, /sync, /auth, /settings, /restart, /editprompt, /model commands');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'editprompt-section-select') {
    await editPromptCommand.handleSectionSelect(interaction);
    return;
  }

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
    } else if (interaction.commandName === 'gather') {
      await gatherCommand.execute(interaction);
    }
  } catch (commandError) {
    console.error(`Error executing ${interaction.commandName} command:`, commandError);
    
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
      
      const delay = Math.pow(2, retries) * 1000;
      console.log(`Retrying login in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

loginWithRetry();
