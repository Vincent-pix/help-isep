// PM2 — lancer depuis la racine du projet : pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'help-isep-api',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
