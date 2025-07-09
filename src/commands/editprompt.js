const { SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { loadSystemPrompt } = require('../services/openai');

const data = new SlashCommandBuilder()
  .setName('editprompt')
  .setDescription('Edit the system prompt (admin only)');

async function getPromptSections() {
  const dataDir = path.join(__dirname, '../../data');
  try {
    const files = await fs.readdir(dataDir);
    return files
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const id = path.parse(file).name;
        const label = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return { id, label, file };
      });
  } catch (error) {
    console.error('Error reading prompt directory:', error);
    return [];
  }
}

async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to edit the system prompt.', ephemeral: true });
    return;
  }
  
  const sections = await getPromptSections();
  if (sections.length === 0) {
    await interaction.reply({ content: 'No prompt files found to edit.', ephemeral: true });
    return;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('editprompt-section-select')
    .setPlaceholder('Select a section to edit')
    .addOptions(
      sections.map(section => new StringSelectMenuOptionBuilder().setLabel(section.label).setValue(section.id))
    );
  await interaction.reply({
    content: 'Which section would you like to edit?',
    components: [new ActionRowBuilder().addComponents(selectMenu)],
    ephemeral: true,
  });
}

async function handleSectionSelect(interaction) {
  if (interaction.customId !== 'editprompt-section-select') return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.update({ content: 'You must be a server admin to edit the system prompt.', components: [], ephemeral: true });
    return;
  }
  const sectionId = interaction.values[0];
  const sections = await getPromptSections();
  const section = sections.find(s => s.id === sectionId);
  if (!section) {
    await interaction.update({ content: 'Invalid section selected.', components: [], ephemeral: true });
    return;
  }
  let sectionContent = '';
  try {
    const sectionPath = path.join(__dirname, '../../data', section.file);
    sectionContent = await fs.readFile(sectionPath, 'utf8');
  } catch (err) {
    sectionContent = '';
  }
  const modal = new ModalBuilder()
    .setCustomId(`editprompt-modal-${section.id}`)
    .setTitle(`Edit: ${section.label}`);
  const promptInput = new TextInputBuilder()
    .setCustomId('section-content-input')
    .setLabel(`${section.label} (max 4000 chars)`)
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(4000)
    .setValue(sectionContent.slice(0, 4000));
  modal.addComponents(new ActionRowBuilder().addComponents(promptInput));
  await interaction.showModal(modal);
}

async function handleModalSubmit(interaction) {
  const sections = await getPromptSections();
  const section = sections.find(s => interaction.customId === `editprompt-modal-${s.id}`);
  if (!section) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to edit the system prompt.', ephemeral: true });
    return;
  }
  const newContent = interaction.fields.getTextInputValue('section-content-input');
  const sectionPath = path.join(__dirname, '../../data', section.file);
  try {
    await fs.writeFile(sectionPath, newContent, 'utf8');
    if (typeof loadSystemPrompt === 'function') {
      await loadSystemPrompt();
    }
    await interaction.reply({ content: `${section.label} updated successfully!`, ephemeral: true });
  } catch (err) {
    await interaction.reply({ content: `Failed to update ${section.label}: ` + err.message, ephemeral: true });
  }
}

module.exports = { data, execute, handleSectionSelect, handleModalSubmit };