/**
 * Keyword-based message search with automatic variant generation and Midjourney image detection
 */

async function findLastPinCommand(channel, maxMessages = 500) {
    try {
        let lastId = null;
        const batchSize = 100;
        let fetchedCount = 0;

        while (fetchedCount < maxMessages) {
            const fetchOptions = {
                limit: Math.min(batchSize, maxMessages - fetchedCount)
            };
            if (lastId) {
                fetchOptions.before = lastId;
            }

            const messages = await channel.messages.fetch(fetchOptions);
            if (messages.size === 0) break;

            for (const message of messages.values()) {
                if (message.interaction?.commandName === 'pin' && message.content && message.content.includes('Pinned successfully')) {
                    return message;
                }
            }

            lastId = messages.last().id;
            fetchedCount += messages.size;

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return null;
    } catch (error) {
        console.error('Error finding last pin command:', error);
        return null;
    }
}

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

function generateKeywordVariants(keyword) {
    const variants = new Set([keyword.toLowerCase()]);

    if (!keyword.toLowerCase().endsWith('s')) {
        variants.add(keyword.toLowerCase() + 's');
    }

    if (keyword.toLowerCase().endsWith('s') && keyword.length > 1) {
        variants.add(keyword.toLowerCase().slice(0, -1));
    }

    const lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.includes(' ')) {
        variants.add(lowerKeyword.replace(/\s+/g, '-'));
    }

    if (lowerKeyword.includes('-')) {
        variants.add(lowerKeyword.replace(/-/g, ' '));
    }

    return Array.from(variants);
}

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
 * Detects Midjourney upscaled images only (excludes 4-image grids)
 * Requires "- Image #" pattern in message content
 */
function messageHasImages(message) {
    if (!message.content || !message.content.includes('- Image #')) {
        return false;
    }

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

async function extractImageMessageIds(channel, keyword, afterMessage = null, maxResults = 10) {
    try {
        const keywordVariants = generateKeywordVariants(keyword);
        let messages = [];

        if (afterMessage) {
            messages = await searchMessagesAfter(channel, afterMessage.id);
        } else {
            const recentMessages = await channel.messages.fetch({ limit: 100 });
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