/**
 * Message search utilities for gathering Discord messages with keyword filtering
 */

/**
 * Find the most recent /pin command in channel history
 * @param {Object} channel - Discord channel object
 * @param {number} limit - Maximum messages to search (default: 500)
 * @returns {Object|null} - Message object of last /pin command or null
 */
async function findLastPinCommand(channel, limit = 500) {
    try {
        const messages = await channel.messages.fetch({ limit });

        for (const message of messages.values()) {
            if (message.content && message.content.includes('/pin')) {
                return message;
            }
        }

        return null;
    } catch (error) {
        console.error('Error finding last pin command:', error);
        return null;
    }
}

/**
 * Search for messages after a specific timestamp with pagination
 * @param {Object} channel - Discord channel object
 * @param {string} afterMessageId - Message ID to search after
 * @param {number} maxMessages - Maximum messages to fetch (default: 1000)
 * @returns {Array} - Array of message objects
 */
async function searchMessagesAfter(channel, afterMessageId, maxMessages = 1000) {
    const messages = [];
    let lastId = afterMessageId;
    const batchSize = 100;

    try {
        while (messages.length < maxMessages) {
            const batch = await channel.messages.fetch({
                after: lastId,
                limit: Math.min(batchSize, maxMessages - messages.length)
            });

            if (batch.size === 0) break;

            messages.push(...batch.values());
            lastId = batch.first().id;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return messages;
    } catch (error) {
        console.error('Error searching messages:', error);
        return messages;
    }
}

/**
 * Generate keyword variants (singular/plural)
 * @param {string} keyword - Base keyword
 * @returns {Array} - Array of keyword variants
 */
function generateKeywordVariants(keyword) {
    const variants = [keyword.toLowerCase()];

    if (!keyword.toLowerCase().endsWith('s')) {
        variants.push(keyword.toLowerCase() + 's');
    }

    if (keyword.toLowerCase().endsWith('s') && keyword.length > 1) {
        variants.push(keyword.toLowerCase().slice(0, -1));
    }

    return variants;
}

/**
 * Check if message content matches any keyword variants
 * @param {Object} message - Discord message object
 * @param {Array} keywordVariants - Array of keyword variants to match
 * @returns {boolean} - True if message matches any keyword
 */
function messageMatchesKeywords(message, keywordVariants) {
    const searchContent = [];

    if (message.content) {
        searchContent.push(message.content.toLowerCase());
    }

    if (message.embeds && message.embeds.length > 0) {
        message.embeds.forEach(embed => {
            if (embed.description) {
                searchContent.push(embed.description.toLowerCase());
            }
            if (embed.title) {
                searchContent.push(embed.title.toLowerCase());
            }
        });
    }

    if (message.attachments && message.attachments.size > 0) {
        message.attachments.forEach(attachment => {
            if (attachment.name) {
                searchContent.push(attachment.name.toLowerCase());
            }
        });
    }

    const fullContent = searchContent.join(' ');

    return keywordVariants.some(variant =>
        fullContent.includes(variant.toLowerCase())
    );
}

/**
 * Check if message has images (attachments or embeds)
 * @param {Object} message - Discord message object
 * @returns {boolean} - True if message contains images
 */
function messageHasImages(message) {
    if (message.attachments && message.attachments.size > 0) {
        for (const attachment of message.attachments.values()) {
            if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                return true;
            }
        }
    }

    if (message.embeds && message.embeds.length > 0) {
        for (const embed of message.embeds) {
            if (embed.image || embed.thumbnail) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Extract message IDs from messages that match keyword and contain images
 * @param {Object} channel - Discord channel object
 * @param {string} keyword - Keyword to search for
 * @param {Object|null} afterMessage - Message to search after (null to search all recent)
 * @param {number} maxResults - Maximum results to return (default: 10)
 * @returns {Array} - Array of message IDs
 */
async function extractImageMessageIds(channel, keyword, afterMessage = null, maxResults = 10) {
    try {
        const keywordVariants = generateKeywordVariants(keyword);
        let messages = [];

        if (afterMessage) {
            messages = await searchMessagesAfter(channel, afterMessage.id);
        } else {
            const recentMessages = await channel.messages.fetch({ limit: 500 });
            messages = Array.from(recentMessages.values());
        }

        const matchingIds = [];

        for (const message of messages) {
            if (matchingIds.length >= maxResults) break;

            if (messageHasImages(message) && messageMatchesKeywords(message, keywordVariants)) {
                matchingIds.push(message.id);
            }
        }

        return matchingIds;
    } catch (error) {
        console.error('Error extracting image message IDs:', error);
        return [];
    }
}

module.exports = {
    findLastPinCommand,
    searchMessagesAfter,
    generateKeywordVariants,
    messageMatchesKeywords,
    messageHasImages,
    extractImageMessageIds
};