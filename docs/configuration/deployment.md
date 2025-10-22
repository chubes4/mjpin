# Deployment Configuration

Production deployment patterns using PM2 process manager.

## PM2 Configuration

**Configuration file:** `ecosystem.config.js`

**Purpose:**
- Defines application process configuration
- Manages environment variables
- Handles automatic restart on failure
- Supports graceful shutdown

**Basic structure:**
```javascript
module.exports = {
  apps: [{
    name: 'mjpin',
    script: './src/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    env: {
      NODE_ENV: 'production',
      // Environment variables here
    }
  }]
};
```

## PM2 Commands

**Start application:**
```bash
pm2 start ecosystem.config.js
```

**View status:**
```bash
pm2 status
pm2 list
```

**View logs:**
```bash
pm2 logs mjpin
pm2 logs mjpin --lines 100
```

**Restart application:**
```bash
pm2 restart mjpin
```

**Stop application:**
```bash
pm2 stop mjpin
```

**Delete application:**
```bash
pm2 delete mjpin
```

**Save PM2 configuration:**
```bash
pm2 save
```

**Setup PM2 startup:**
```bash
pm2 startup
pm2 save
```

## Restart Behavior

**Bot-initiated restart:**
Via `/restart` command:
1. Saves restart context to data/restart_info.json
2. Sends "Restarting bot..." message
3. Exits with code 0 after 500ms
4. PM2 detects exit and restarts process
5. Bot reconnects to Discord
6. Bot updates restart message to "Restart successful."
7. Bot deletes restart_info.json

**PM2 automatic restart:**
On crash or error:
- PM2 restarts immediately on exit code 1
- PM2 respects max_restarts configuration
- No restart message update (no context saved)

**Graceful shutdown:**
On SIGTERM or SIGINT:
- Bot calls `client.destroy()`
- Bot exits with code 0
- PM2 does not restart (manual stop/restart)

## Process Management

**Process isolation:**
Single instance per bot (instances: 1).

**Execution mode:**
Fork mode (not cluster).

**Automatic restart:**
Enabled for production reliability.

**Max restarts:**
Configurable limit to prevent restart loops.

**Watch mode:**
Disabled for production (no automatic restart on file changes).

## Logging

**Log location:**
PM2 manages logs:
- stdout: `~/.pm2/logs/mjpin-out.log`
- stderr: `~/.pm2/logs/mjpin-error.log`

**Log rotation:**
Configured via PM2:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

**Application logging:**
Console.log/error redirected to PM2 logs automatically.

## Data Persistence

**Critical data directory:** `/data/`

**Persistent files:**
- `pinterest_tokens.json` - OAuth tokens
- `boards.json` - Cached boards
- `pin_counts.json` - Rate limit tracking
- `model_settings.json` - Model configurations
- `*.txt` - System prompt files

**Deployment strategy:**
- Preserve data/ directory during updates
- Never delete data/ directory
- Back up data/ directory before major updates

**Data directory location:**
Relative to application root. PM2 starts application from correct directory.

## Build and Deployment Process

**Build process:** No build script required - pure Node.js project

**Deployment preparation:**
1. Run `npm install --production` locally
2. Create deployment package manually (exclude .git/, .env, node_modules/)
3. Upload source code to server

**Deployment steps:**
1. Upload source code to server
2. Run `npm install --production` on server
3. Configure environment variables
4. Restart PM2 process: `pm2 restart mjpin`

**Critical:**
Do not delete or overwrite data/ directory during deployment.

## Environment Variables

**Production configuration:**
Set in ecosystem.config.js `env` block or system environment.

**Required variables:**
- MJPIN_DISCORD_TOKEN
- MJPIN_DISCORD_CLIENT_ID
- MJPIN_DISCORD_GUILD_ID
- MJPIN_PINTEREST_CLIENT_ID
- MJPIN_PINTEREST_CLIENT_SECRET
- MJPIN_PINTEREST_REDIRECT_URI
- MJPIN_OPENAI_API_KEY

**Security:**
- Never commit ecosystem.config.js with secrets
- Use environment variable substitution
- Restrict file permissions

## Network Requirements

**Inbound:**
- HTTP/HTTPS port for Pinterest OAuth callback
- Must be publicly accessible

**Outbound:**
- Discord Gateway (WSS): wss://gateway.discord.gg
- Discord API: https://discord.com/api/v10
- Pinterest API: https://api.pinterest.com/v5
- OpenAI API: https://api.openai.com/v1

**Firewall:**
Allow outbound HTTPS (443) and WSS (443).

## Monitoring

**Process monitoring:**
```bash
pm2 status
```

**Real-time monitoring:**
```bash
pm2 monit
```

**Resource usage:**
```bash
pm2 show mjpin
```

**Uptime tracking:**
PM2 tracks uptime, restart count, and memory usage.

## Backup Strategy

**What to back up:**
- data/ directory (all files)
- ecosystem.config.js (configuration)
- .env file (if used)

**Backup frequency:**
- Before major updates
- Daily automated backup recommended

**Restore process:**
1. Stop bot: `pm2 stop mjpin`
2. Restore data/ directory
3. Restore configuration
4. Start bot: `pm2 start mjpin`

## Troubleshooting

**Bot not starting:**
```bash
pm2 logs mjpin --lines 50
```
Check for environment variable errors or connection issues.

**Bot restarting repeatedly:**
Check max_restarts count and logs for crash cause.

**Commands not working:**
Verify GUILD_ID matches target Discord server.

**OAuth callback failing:**
Verify REDIRECT_URI matches Pinterest app configuration exactly.
