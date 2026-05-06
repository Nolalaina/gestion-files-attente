const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    console.log('New hash for password123:', hash);
    
    await db.query('UPDATE users SET password = ?, active = 1, is_verified = 1 WHERE email IN ("admin@queue.mg", "agent1@queue.mg", "agent2@queue.mg")', [hash]);
    console.log('Passwords updated successfully in DB!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixPasswords();
