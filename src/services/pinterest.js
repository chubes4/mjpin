const axios = require('axios');
const { readJsonFile, writeJsonFile } = require('../utils/jsonFileManager');
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

/**
 * Get the active Pinterest account for a Discord user.
 * @param {string} discordUserId - The Discord user ID.
 * @returns {Promise<object|null>} The active account object or null if none found.
 */
async function getActiveAccount(discordUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  const userData = tokens[discordUserId];
  
  if (!userData || !userData.activeAccount || !userData.accounts) {
    return null;
  }
  
  return userData.accounts[userData.activeAccount] || null;
}

/**
 * Get all Pinterest accounts for a Discord user.
 * @param {string} discordUserId - The Discord user ID.
 * @returns {Promise<Array>} Array of account objects.
 */
async function getAllAccounts(discordUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  const userData = tokens[discordUserId];
  
  if (!userData || !userData.accounts) {
    return [];
  }
  
  return Object.values(userData.accounts);
}

/**
 * Set the active Pinterest account for a Discord user.
 * @param {string} discordUserId - The Discord user ID.
 * @param {string} pinterestUserId - The Pinterest user ID to set as active.
 * @returns {Promise<boolean>} Success status.
 */
async function setActiveAccount(discordUserId, pinterestUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  
  if (!tokens[discordUserId] || !tokens[discordUserId].accounts || !tokens[discordUserId].accounts[pinterestUserId]) {
    return false;
  }
  
  tokens[discordUserId].activeAccount = pinterestUserId;
  await writeJsonFile('pinterest_tokens.json', tokens);
  return true;
}

/**
 * Save a new Pinterest account for a Discord user.
 * @param {string} discordUserId - The Discord user ID.
 * @param {string} pinterestUserId - The Pinterest user ID.
 * @param {string} accessToken - The access token.
 * @param {string} accountName - A friendly name for the account.
 * @returns {Promise<void>}
 */
async function saveAccount(discordUserId, pinterestUserId, accessToken, accountName) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  
  if (!tokens[discordUserId]) {
    tokens[discordUserId] = {
      accounts: {},
      activeAccount: null
    };
  }
  
  tokens[discordUserId].accounts[pinterestUserId] = {
    accessToken,
    pinterestUserId,
    accountName,
    createdAt: new Date().toISOString()
  };
  
  // If this is the first account, make it active
  if (!tokens[discordUserId].activeAccount) {
    tokens[discordUserId].activeAccount = pinterestUserId;
  }
  
  await writeJsonFile('pinterest_tokens.json', tokens);
}

/**
 * Get boards for a specific Pinterest account.
 * @param {string} pinterestUserId - The Pinterest user ID.
 * @returns {Promise<Array>} Array of board objects.
 */
async function getBoardsForAccount(pinterestUserId) {
  const boards = await readJsonFile('boards.json');
  return boards[pinterestUserId] || [];
}

/**
 * Save boards for a specific Pinterest account.
 * @param {string} pinterestUserId - The Pinterest user ID.
 * @param {Array} boardsArray - Array of board objects.
 * @returns {Promise<void>}
 */
async function saveBoardsForAccount(pinterestUserId, boardsArray) {
  const boards = await readJsonFile('boards.json');
  boards[pinterestUserId] = boardsArray;
  await writeJsonFile('boards.json', boards);
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
      
      // Get Pinterest user info to use as account key
      const userResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const pinterestUserId = userResponse.data.id;
      const username = userResponse.data.username || 'Pinterest Account';
      const accountName = `${username} (${pinterestUserId.substring(0, 8)})`;
      
      // Save the account
      await saveAccount(state, pinterestUserId, response.data.access_token, accountName);
      
      res.send(`Pinterest authentication successful! Account "${accountName}" has been added. You can now use the bot.`);
      console.log(`Saved Pinterest account "${accountName}" for Discord user ${state}`);
    } catch (err) {
      console.error('Pinterest OAuth error:', err.response?.data || err.message);
      res.status(500).send('Pinterest authentication failed: ' + (err.response?.data?.error || err.message));
    }
  });
}

module.exports = {
  pinImageToBoard,
  registerPinterestAuthRoute,
  getActiveAccount,
  getAllAccounts,
  setActiveAccount,
  saveAccount,
  getBoardsForAccount,
  saveBoardsForAccount,
};
