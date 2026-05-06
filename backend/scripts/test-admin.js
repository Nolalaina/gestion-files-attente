async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queue.mg', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.error || 'Login failed');
    const token = loginData.token;
    console.log('Login OK, Token acquired');

    const headers = { Authorization: `Bearer ${token}` };
    const endpoints = [
      '/api/stats',
      '/api/stats/history?days=7',
      '/api/users?status=&search=',
      '/api/services',
      '/api/stats/logs?limit=50',
      '/api/tickets?limit=100',
      '/api/bank/admin/accounts?limit=100'
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(`http://localhost:5000${ep}`, { headers });
        const data = await res.json();
        if (res.ok) {
          console.log(`✅ [200] ${ep}`);
        } else {
          console.error(`❌ [${res.status}] ${ep}:`, data.error || data);
        }
      } catch (e) {
        console.error(`❌ [Error] ${ep}:`, e.message);
      }
    }
  } catch (err) {
    console.error('Login Failed:', err.message);
  }
}

test();
