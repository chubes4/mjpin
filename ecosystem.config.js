module.exports = {
  apps: [{
    name: 'mjpin',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    env: {
      NODE_ENV: 'production'
    },
    kill_timeout: 5000,
    listen_timeout: 3000,
    wait_ready: true
  }]
}; 