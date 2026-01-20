module.exports = {
  apps: [
    {
      name: 'metricool-api',
      script: 'server.js',
      instances: 'max', // Or a specific number like 1, 2
      exec_mode: 'cluster', // Use 'fork' if you don't want clustering
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Error handling and logs
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};
