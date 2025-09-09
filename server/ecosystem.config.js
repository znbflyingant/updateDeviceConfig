module.exports = {
  apps: [
    {
      name: 'firmware-server-prod',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      max_memory_restart: '300M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'firmware-server-test',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'test',
        PORT: 3101
      },
      max_memory_restart: '300M',
      error_file: './logs/err-test.log',
      out_file: './logs/out-test.log',
      merge_logs: true,
      time: true
    }
  ]
}


