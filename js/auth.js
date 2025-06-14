window.Auth = (function() {
    async function login(email, password) {
        try {
            const resp = await fetch(ServerConfig.get().baseUrl + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!resp.ok) throw new Error('Login failed');
            const data = await resp.json();
            if (data.token) {
                ServerConfig.set({ authToken: data.token });
                return true;
            }
        } catch (err) {
            console.error('Login error:', err);
        }
        return false;
    }

    return { login };
})();

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const ok = await Auth.login(email, password);
    if (ok) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('loginError').textContent = 'Login fehlgeschlagen';
    }
});
