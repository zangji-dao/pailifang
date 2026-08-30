const path = require('path');

module.exports = {
  apps: [
    {
      name: 'pi-backend',
      script: 'dist/index.js',
      cwd: path.join(__dirname, 'backend'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: '4001',
      },
      error_file: path.join(__dirname, 'logs/backend-error.log'),
      out_file: path.join(__dirname, 'logs/backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'pi-frontend',
      script: path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next'),
      args: 'start --port 4000',
      cwd: __dirname,
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      error_file: path.join(__dirname, 'logs/frontend-error.log'),
      out_file: path.join(__dirname, 'logs/frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
