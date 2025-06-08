require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const pinCommand = require('./commands/pin');

// Load environment variables
const DISCORD_TOKEN = process.env.MJPIN_DISCORD_TOKEN;
const GUILD_ID = process.env.MJPIN_DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.MJPIN_DISCORD_CHANNEL_ID;
const CLIENT_ID = process.env.MJPIN_DISCORD_CLIENT_ID;

// Debug log to verify .env loading
console.log('Loaded from .env:', {
  CLIENT_ID,
  DISCORD_TOKEN: DISCORD_TOKEN ? '[HIDDEN]' : undefined,
  GUILD_ID,
  CHANNEL_ID
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
  // Register /pin command for the guild
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: [pinCommand.data.toJSON()] }
    );
    console.log('Registered /pin command');
  } catch (error) {
    console.error('Error registering slash command:', error);
  }
});

client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
  // Optionally send error to a Discord channel
  if (CHANNEL_ID) {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (channel) {
      channel.send(`:warning: Bot error: ${error.message}`);
    }
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'pin') {
    await pinCommand.execute(interaction);
  }
});

client.login(DISCORD_TOKEN);
