#!/usr/bin/env node
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { getDatabase, closeDatabase } = require('../db');
const { hashPassword } = require('../utils/crypto');

function seedAdmin() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@lawazia.com').trim().toLowerCase();
  const password = (process.argv[3] || process.env.ADMIN_PASSWORD || 'Admin@123456').trim();
  const name = (process.argv[4] || process.env.ADMIN_NAME || 'System Admin').trim();

  if (!email || !password) {
    console.error('Usage: node seedAdmin.js [email] [password] [name]');
    process.exit(1);
  }

  const db = getDatabase();

  const existing = db.prepare('SELECT id, email, role FROM users WHERE email = ? COLLATE NOCASE').get(email);
  const hashedPassword = hashPassword(password);

  if (existing) {
    db.prepare(`
      UPDATE users 
      SET password_hash = ?, role = 'ADMIN', name = ?
      WHERE id = ?
    `).run(hashedPassword, name, existing.id);
    console.log(`[Admin Seed] Updated existing account (#${existing.id}, ${email}) to role ADMIN.`);
  } else {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'ADMIN')
    `).run(name, email, hashedPassword);
    console.log(`[Admin Seed] Created new ADMIN account (#${result.lastInsertRowid}, ${email}).`);
  }

  console.log(`[Admin Seed] Credentials: Email: ${email} | Password: ${password}`);
  closeDatabase();
}

if (require.main === module) {
  seedAdmin();
}

module.exports = { seedAdmin };
