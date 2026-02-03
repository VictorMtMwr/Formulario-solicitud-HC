// PM2 - Gestor de procesos para producción
// Uso: pm2 start config/ecosystem.config.js
// pm2 save && pm2 startup  (para iniciar al reiniciar el servidor)

const path = require('path');

module.exports = {
  apps: [{
    name: 'formulario-hc',
    script: 'src/index.js',
    cwd: path.join(__dirname, '..'),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
