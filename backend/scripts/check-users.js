const db = require('./config/db');
db.query('SELECT id, email, role, active, is_verified, password FROM users').then(([rows]) => {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
