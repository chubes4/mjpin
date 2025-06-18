require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const pinCommand = require('./commands/pin');
const promptCommand = require('./commands/prompt');
const syncCommand = require('./commands/sync');
const authCommand = require('./commands/auth');
const settingsCommand = require('./commands/settings');

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
        settingsCommand.data.toJSON()
      ] }
    );
    console.log('Registered /pin, /prompt, /sync, /auth, and /settings commands');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
  // Remove the channel notification to prevent cross-channel error messages
  // Errors should be handled within each command's context, not globally broadcast
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
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
  }
});

client.login(DISCORD_TOKEN);
