require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'clinical_request_db',
  user: process.env.DB_USER || 'medihelp',
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('Query ejecutada', { text: text.substring(0, 50), duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    console.error('Error en query:', err.message);
    throw err;
  }
}

async function getClient() {
  return pool.connect();
}

module.exports = { pool, query, getClient };
