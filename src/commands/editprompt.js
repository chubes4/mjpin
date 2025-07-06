const { SlashCommandBuilder, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { loadSystemPrompt } = require('../services/openai');

const data = new SlashCommandBuilder()
  .setName('editprompt')
  .setDescription('Edit the system prompt (admin only)');

const SECTIONS = [
  { id: 'instructions', label: 'Formatting Instructions', file: 'system_prompt_instructions.txt' },
  { id: 'wordbanks', label: 'Word Banks', file: 'system_prompt_word_banks.txt' },
];

async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to edit the system prompt.', ephemeral: true });
    return;
  }
  // Present a select menu for section choice
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('editprompt-section-select')
    .setPlaceholder('Select a section to edit')
    .addOptions(
      SECTIONS.map(section => new StringSelectMenuOptionBuilder().setLabel(section.label).setValue(section.id))
    );
  await interaction.reply({
    content: 'Which section would you like to edit?',
    components: [new ActionRowBuilder().addComponents(selectMenu)],
    ephemeral: true,
  });
}

// Section select handler
async function handleSectionSelect(interaction) {
  if (interaction.customId !== 'editprompt-section-select') return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.update({ content: 'You must be a server admin to edit the system prompt.', components: [], ephemeral: true });
    return;
  }
  const sectionId = interaction.values[0];
  const section = SECTIONS.find(s => s.id === sectionId);
  if (!section) {
    await interaction.update({ content: 'Invalid section selected.', components: [], ephemeral: true });
    return;
  }
  // Read the section file
  let sectionContent = '';
  try {
    const sectionPath = path.join(__dirname, '../../data', section.file);
    sectionContent = await fs.readFile(sectionPath, 'utf8');
  } catch (err) {
    sectionContent = '';
  }
  // Show modal for editing (do NOT call update here)
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

// Modal submission handler
async function handleModalSubmit(interaction) {
  const section = SECTIONS.find(s => interaction.customId === `editprompt-modal-${s.id}`);
  if (!section) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await interaction.reply({ content: 'You must be a server admin to edit the system prompt.', ephemeral: true });
    return;
  }
  const newContent = interaction.fields.getTextInputValue('section-content-input');
  const sectionPath = path.join(__dirname, '../../data', section.file);
  try {
    await fs.writeFile(sectionPath, newContent, 'utf8');
    // Reload the prompt in memory
    if (typeof loadSystemPrompt === 'function') {
      await loadSystemPrompt();
    }
    await interaction.reply({ content: `${section.label} updated successfully!`, ephemeral: true });
  } catch (err) {
    await interaction.reply({ content: `Failed to update ${section.label}: ` + err.message, ephemeral: true });
  }
}

module.exports = { data, execute, handleSectionSelect, handleModalSubmit }; 