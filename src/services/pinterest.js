const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

/**
 * Pin an image to a Pinterest board using the v5 API.
 * @param {string} board - The board slug (e.g., 'paper-crafts').
 * @param {string} imageUrl - The image URL to pin.
 * @param {string} url - The destination URL for the pin.
 * @param {string} accessToken - The Pinterest access token for the user.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function pinImageToBoard(board, imageUrl, url, accessToken) {
  if (!accessToken) {
    return { success: false, error: 'Pinterest access token not set.' };
  }
  const apiUrl = 'https://api.pinterest.com/v5/pins';
  const data = {
    board_id: board,
    media_source: {
      source_type: 'image_url',
      url: imageUrl
    },
    link: url
  };
  console.log('Sending to Pinterest:', JSON.stringify(data, null, 2));
  try {
    const response = await axios.post(apiUrl, data, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    if (error.response) {
      console.error('Pinterest API error response:', JSON.stringify(error.response.data, null, 2));
    }
    let errMsg = error.response && error.response.data && error.response.data.message
      ? error.response.data.message
      : error.message;
    return { success: false, error: errMsg };
  }
}

// Register the Pinterest OAuth callback route
function registerPinterestAuthRoute(app) {
  app.get('/pinterest/callback', async (req, res) => {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send('Missing code parameter.');
    }
    try {
      const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';
      const response = await axios.post(tokenUrl, {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.MJPIN_PINTEREST_CLIENT_ID,
        client_secret: process.env.MJPIN_PINTEREST_CLIENT_SECRET,
        redirect_uri: process.env.MJPIN_PINTEREST_REDIRECT_URI,
      });
      // Save the access token, associated with the Discord user (state)
      const tokens = fs.existsSync('pinterest_tokens.json')
        ? JSON.parse(fs.readFileSync('pinterest_tokens.json', 'utf8'))
        : {};
      tokens[state] = response.data.access_token;
      fs.writeFileSync('pinterest_tokens.json', JSON.stringify(tokens, null, 2));
      res.send('Pinterest authentication successful! You can now use the bot.');
      console.log(`Saved Pinterest token for Discord user ${state}`);
    } catch (err) {
      console.error('Pinterest OAuth error:', err.response?.data || err.message);
      res.status(500).send('Pinterest authentication failed: ' + (err.response?.data?.error || err.message));
    }
  });
}

module.exports = {
  pinImageToBoard,
  registerPinterestAuthRoute,
};
