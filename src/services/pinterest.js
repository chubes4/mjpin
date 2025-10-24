/**
 * Pinterest v5 API integration with Express OAuth callback and multi-account management
 */
const axios = require('axios');
const { readJsonFile, writeJsonFile } = require('../utils/jsonFileManager');
require('dotenv').config();

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

async function getActiveAccount(discordUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  const userData = tokens[discordUserId];

  if (!userData || !userData.activeAccount || !userData.accounts) {
    return null;
  }

  return userData.accounts[userData.activeAccount] || null;
}

async function getAllAccounts(discordUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');
  const userData = tokens[discordUserId];

  if (!userData || !userData.accounts) {
    return [];
  }

  return Object.values(userData.accounts);
}

async function setActiveAccount(discordUserId, pinterestUserId) {
  const tokens = await readJsonFile('pinterest_tokens.json');

  if (!tokens[discordUserId] || !tokens[discordUserId].accounts || !tokens[discordUserId].accounts[pinterestUserId]) {
    return false;
  }

  tokens[discordUserId].activeAccount = pinterestUserId;
  await writeJsonFile('pinterest_tokens.json', tokens);
  return true;
}

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

  if (!tokens[discordUserId].activeAccount) {
    tokens[discordUserId].activeAccount = pinterestUserId;
  }

  await writeJsonFile('pinterest_tokens.json', tokens);
}

async function getBoardsForAccount(pinterestUserId) {
  const boards = await readJsonFile('boards.json');
  return boards[pinterestUserId] || [];
}

async function saveBoardsForAccount(pinterestUserId, boardsArray) {
  const boards = await readJsonFile('boards.json');
  boards[pinterestUserId] = boardsArray;
  await writeJsonFile('boards.json', boards);
}

/**
 * Registers Express OAuth callback route for Pinterest authorization
 * State parameter carries Discord user ID for account association
 */
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

      const userResponse = await axios.get('https://api.pinterest.com/v5/user_account', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const pinterestUserId = userResponse.data.id;
      const username = userResponse.data.username || 'Pinterest Account';
      const accountName = `${username} (${pinterestUserId.substring(0, 8)})`;

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
