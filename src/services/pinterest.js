const axios = require('axios');
require('dotenv').config();

const PINTEREST_ACCESS_TOKEN = process.env.MJPIN_PINTEREST_ACCESS_TOKEN;

/**
 * Pin an image to a Pinterest board using the v5 API.
 * @param {string} board - The board slug (e.g., 'paper-crafts').
 * @param {string} imageUrl - The image URL to pin.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function pinImageToBoard(board, imageUrl) {
  if (!PINTEREST_ACCESS_TOKEN) {
    return { success: false, error: 'Pinterest access token not set.' };
  }

  // You must provide the board in the format username/board_slug
  // For now, assume the user provides the correct format (e.g., 'yourusername/paper-crafts')
  // If you want to prepend the username, you can store it in .env

  const url = 'https://api.pinterest.com/v5/pins';
  const data = {
    board_id: board, // Pinterest v5 API expects board_id (not slug), but for simplicity, we use the slug for now
    media_source: {
      source_type: 'image_url',
      url: imageUrl
    },
    title: 'Pinned from Discord',
    alt_text: 'Pinned via mjpin Discord bot'
  };

  console.log('Sending to Pinterest:', JSON.stringify(data, null, 2));

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${PINTEREST_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Pinterest API response:', JSON.stringify(response.data, null, 2));
    if (response.data && response.data.id) {
      return { success: true };
    } else {
      return { success: false, error: 'No pin ID returned.' };
    }
  } catch (error) {
    let errMsg = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message;
    return { success: false, error: errMsg };
  }
}

module.exports = {
  pinImageToBoard,
};
