window.Auth = (function() {
    async function login(username, password) {
        try {
            const resp = await fetch(ServerConfig.get().baseUrl + '/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                throw new Error(data.error || 'Login fehlgeschlagen');
            }
            if (data.token) {
                ServerConfig.set({ authToken: data.token });
                return true;
            }
            throw new Error('Login fehlgeschlagen');
        } catch (err) {
            console.error('Login error:', err);
            throw err;
        }
    }

    return { login };
})();

document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const successEl = document.getElementById('loginSuccess');
    const errorEl = document.getElementById('loginError');
    successEl.textContent = '';
    errorEl.textContent = '';

    try {
        await Auth.login(username, password);
        successEl.textContent = 'Login erfolgreich, Weiterleitung ...';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (err) {
        let msg = err.message || 'Login fehlgeschlagen';
        if (msg === 'Invalid credentials') {
            msg = 'Benutzername oder Passwort falsch. <a href="register.html">Registrieren?</a>';
        }
        errorEl.innerHTML = msg;
    }
});
