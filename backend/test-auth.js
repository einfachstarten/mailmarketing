const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const email = `testuser_${Date.now()}@example.com`;
const password = 'testpass';

async function register() {
    const resp = await fetch(baseUrl + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log('register status', resp.status);
    return resp.ok;
}

async function login() {
    const resp = await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    console.log('login status', resp.status);
    if (!resp.ok) return false;
    const data = await resp.json();
    console.log('token', data.token ? 'received' : 'none');
    return !!data.token;
}

(async () => {
    await register();
    await login();
})();
