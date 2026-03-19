// PM2 生产环境配置
// 敏感信息通过环境变量传入，不在代码中硬编码
// 
// 使用方法：
// PG_PASSWORD=xxx pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: "pi-backend",
      script: "npx",
      args: "tsx src/index.ts",
      cwd: "/var/www/pi-cube/backend",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        COZE_PROJECT_ENV: "PROD",
        PORT: "4001",
        // PG_PASSWORD 通过命令行环境变量传入
      },
      env_production: {
        NODE_ENV: "production",
        COZE_PROJECT_ENV: "PROD",
        PORT: "4001",
      },
      error_file: "/var/www/pi-cube/logs/backend-error.log",
      out_file: "/var/www/pi-cube/logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    },
    {
      name: "pi-frontend",
      script: "pnpm",
      args: "run start",
      cwd: "/var/www/pi-cube",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        COZE_PROJECT_ENV: "PROD",
        PORT: "4000",
      },
      error_file: "/var/www/pi-cube/logs/frontend-error.log",
      out_file: "/var/www/pi-cube/logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z"
    }
  ]
};
