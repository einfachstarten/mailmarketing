const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const username = `testuser_${Date.now()}`;
const password = 'testpass';

async function register() {
    const resp = await fetch(baseUrl + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    console.log('register status', resp.status);
    return resp.ok;
}

async function login() {
    const resp = await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
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
