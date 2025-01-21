const { Pool } = require('pg');
require('dotenv').config();
const logger = require('../utils/logger');

// Ensure environment variables are set
const requiredEnvVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    logger.error(`Environment variable ${envVar} is missing`);
    process.exit(1);
  }
});

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432
});

// Test database connection
(async () => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');
  } catch (err) {
    logger.error('Database connection error:', err);
    process.exit(1);
  }
})();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};