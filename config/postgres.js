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

      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'INQUIRY',
        call_count INTEGER DEFAULT 1,
        notes TEXT,
        source VARCHAR(100) DEFAULT 'Direct Call',
        last_called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries(phone);
      CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
      CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

      CREATE TABLE IF NOT EXISTS payment_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        data BYTEA NOT NULL,
        size INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_files_filename ON payment_files(filename);

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
    `);

    // Auto-seed default admins into PostgreSQL for instant, high-reliability authentication on Vercel
    const defaultAdmins = [
      { name: "Diwali Contest Admin 1", email: "admin1@chithiraicreations.com", password: "Admin123!", role: "admin", phone: "+917010240042" },
      { name: "Diwali Contest Admin 2", email: "admin2@chithiraicreations.com", password: "Admin123!", role: "admin", phone: "+917010240043" },
      { name: "Super Admin", email: "superadmin@chithiraicreations.com", password: "SuperAdmin123!", role: "super_admin", phone: "+919876543210" },
      { name: "Event Manager 1", email: "manager1@chithiraicreations.com", password: "Manager1123!", role: "admin", phone: "+919876543211" },
      { name: "Event Manager 2", email: "manager2@chithiraicreations.com", password: "Manager2123!", role: "admin", phone: "+919876543212" },
      { name: "Ticket Counter 1", email: "counter1@chithiraicreations.com", password: "Counter1123!", role: "support", phone: "+919876543213" },
      { name: "Ticket Counter 2", email: "counter2@chithiraicreations.com", password: "Counter2123!", role: "support", phone: "+919876543214" },
    ];

    const bcrypt = require("bcryptjs");
    for (const a of defaultAdmins) {
      const existing = await client.query("SELECT id FROM admins WHERE LOWER(email) = LOWER($1)", [a.email]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(a.password, 10);
        await client.query(
          "INSERT INTO admins (name, email, password, role, phone, is_active) VALUES ($1, $2, $3, $4, $5, TRUE)",
          [a.name, a.email.toLowerCase(), hash, a.role, a.phone]
        );
      }
    }

    client.release();
    console.log('✅ diwali_registrations, inquiries, payment_files & admins PostgreSQL table schema verified.');
  } catch (error) {
    console.error('❌ Failed to connect/initialize PostgreSQL:', error.message);
  }
}

module.exports = { pool, initPostgres };
