const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'pg-1f2f3255-chithiraicreationsofficial.b.aivencloud.com',
  port: Number(process.env.PG_PORT) || 10254,
  database: process.env.PG_DATABASE || 'defaultdb',
  user: process.env.PG_USER || 'avnadmin',
  password: process.env.PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

async function initPostgres() {
  if (!process.env.PG_PASSWORD) {
    console.warn("⚠️ PG_PASSWORD is not set in environment variables. Skipping PostgreSQL auto-init.");
    return;
  }

  try {
    const client = await pool.connect();
    console.log('✅ Connected to Aiven PostgreSQL database successfully!');

    await client.query(`
      CREATE TABLE IF NOT EXISTS diwali_registrations (
        id SERIAL PRIMARY KEY,
        registration_id VARCHAR(50) UNIQUE NOT NULL,
        token VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        gender VARCHAR(50) NOT NULL,
        state VARCHAR(100) DEFAULT 'Tamil Nadu',
        district VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        instagram_profile VARCHAR(255) NOT NULL,
        sweet_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        ingredients TEXT,
        payment_screenshot VARCHAR(500),
        status VARCHAR(50) DEFAULT 'PENDING',
        verified_at TIMESTAMP,
        verified_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_diwali_phone ON diwali_registrations(phone);
      CREATE INDEX IF NOT EXISTS idx_diwali_email ON diwali_registrations(email);
    `);

    client.release();
    console.log('✅ diwali_registrations PostgreSQL table schema verified.');
  } catch (error) {
    console.error('❌ Failed to connect/initialize PostgreSQL:', error.message);
  }
}

module.exports = { pool, initPostgres };
