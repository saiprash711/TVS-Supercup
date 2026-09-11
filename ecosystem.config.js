// PM2 Ecosystem Configuration for VPS/EC2 Deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'supercup-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/supercup',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/supercup-web-error.log',
      out_file: '/var/log/pm2/supercup-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'supercup-sync',
      script: 'npm',
      args: 'run sync:live',
      cwd: '/var/www/supercup',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        AUCTION_ID: '1978',
        SYNC_INTERVAL_MS: '10000'
      },
      error_file: '/var/log/pm2/supercup-sync-error.log',
      out_file: '/var/log/pm2/supercup-sync-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart on specific days/times if needed
      cron_restart: '0 13 * * 4' // Restart at 1 PM every Thursday (1 hour before auction)
    }
  ]
};
