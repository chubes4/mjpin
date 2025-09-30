const { SlashCommandBuilder } = require('discord.js');
const { findLastPinCommand, extractImageMessageIds } = require('../utils/messageSearch');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gather')
        .setDescription('Gather message IDs for images matching a keyword after the last /pin command')
        .addStringOption(option =>
            option.setName('keyword')
                .setDescription('Keyword to search for in image messages (automatically includes plural/singular)')
                .setRequired(true)
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const keyword = interaction.options.getString('keyword');
            const channel = interaction.channel;
            const lastPinMessage = await findLastPinCommand(channel);

            let searchDescription = '';
            if (lastPinMessage) {
                const pinDate = lastPinMessage.createdAt.toLocaleString();
                searchDescription = `Searching for "${keyword}" images after last /pin command (${pinDate})...`;
            } else {
                searchDescription = `No previous /pin command found. Searching recent "${keyword}" images...`;
            }

            await interaction.editReply(searchDescription);

            const messageIds = await extractImageMessageIds(channel, keyword, lastPinMessage, 10);

            if (messageIds.length === 0) {
                await interaction.editReply(`No images found matching "${keyword}".`);
                return;
            }

            const pinCommandParts = ['/pin', `board:${keyword}`];
            messageIds.forEach((id, index) => {
                pinCommandParts.push(`message_id_${index + 1}:${id}`);
            });
            const pinCommand = pinCommandParts.join(' ');
            const response = `Found ${messageIds.length} matching image${messageIds.length === 1 ? '' : 's'} for "${keyword}":\n\n\`\`\`${pinCommand}\`\`\``;

            await interaction.editReply(response);

        } catch (error) {
            console.error('Error in gather command:', error);
            const errorMessage = 'An error occurred while gathering images. Please try again.';

            if (interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};