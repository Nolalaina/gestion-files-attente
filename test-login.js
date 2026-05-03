const http = require('http');
const data = JSON.stringify({email: 'admin@queue.mg', password: 'password123'});
const req = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
  headers: {'Content-Type': 'application/json', 'Content-Length': data.length}
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => { console.log('STATUS:', res.statusCode, 'BODY:', body); });
});
req.write(data); req.end();
