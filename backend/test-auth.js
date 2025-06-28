const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
const username = `testuser_${Date.now()}`;
const password = 'testpass';

async function register() {
    const resp = await fetch(baseUrl + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return resp.ok;
}

async function login() {
    const resp = await fetch(baseUrl + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return !!data.token;
}

(async () => {
    await register();
    await login();
})();
