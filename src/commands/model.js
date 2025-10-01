const { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, PermissionsBitField, ComponentType } = require('discord.js');
const axios = require('axios');
const { getModelForGuild, setModelForGuild } = require('../services/modelSettings');

const data = new SlashCommandBuilder()
  .setName('model')
  .setDescription('Choose the OpenAI model for this server (Manage Server only)');

function filterChatModels(models) {
  const deny = /(embedding|whisper|text-embedding|tts|audio|image|vision|clip|dall|ft:|omni|sprites)/i;
  const allow = /^(gpt|o[34]|gpt-4|gpt-5)/i;
  return models
  .map(m => (typeof m === 'string' ? { id: m } : { id: String(m?.id ?? '') }))
  .filter(m => m.id && !/^gpt-3/i.test(m.id))
  .filter(m => !/preview/i.test(m.id))
  .filter(m => !/transcribe/i.test(m.id))
  .filter(m => !/turbo/i.test(m.id))
  .filter(m => allow.test(m.id) && !deny.test(m.id))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchOpenAIModels(apiKey) {
  const resp = await axios.get('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const items = Array.isArray(resp.data?.data) ? resp.data.data : [];
  return items.map(i => String(i.id));
}

async function execute(interaction) {
  const guildId = interaction.guildId;
  const apiKey = process.env.MJPIN_OPENAI_API_KEY;

  if (!guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
    await interaction.reply({ content: 'You need Manage Server permission to set the model.', ephemeral: true });
    return;
  }
  if (!apiKey) {
    await interaction.reply({ content: 'OpenAI API key is not configured on the server.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });
  try {
    const all = await fetchOpenAIModels(apiKey);
    const chatModels = filterChatModels(all);
    if (chatModels.length === 0) {
      await interaction.editReply('No chat-capable models available for selection.');
      return;
    }
    const current = await getModelForGuild(guildId);
    const options = chatModels.slice(0, 25).map(m => {
      const opt = new StringSelectMenuOptionBuilder()
        .setLabel(m.id.length > 100 ? m.id.slice(0, 97) + '...' : m.id)
        .setValue(m.id)
        .setDefault(m.id === current);
      if (m.id === current) opt.setDescription('Currently selected');
      return opt;
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId('select_openai_model')
      .setPlaceholder('Choose an OpenAI model for this server')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(select);

    const reply = await interaction.editReply({
      content: current ? `Current model: ${current}\nSelect a new model:` : 'Select a model for this server:',
      components: [row],
    });

    const selection = await reply.awaitMessageComponent({
      filter: i => i.user.id === interaction.user.id && i.customId === 'select_openai_model',
      time: 60000,
      componentType: ComponentType.StringSelect,
    });
    const chosen = selection.values[0];
    await setModelForGuild(guildId, chosen);
    await selection.update({ content: `✅ Model saved: ${chosen}`, components: [] });
  } catch (err) {
    await interaction.editReply(`Failed to load or set models: ${err.message}`);
  }
}

module.exports = {
  data,
  execute,
};
