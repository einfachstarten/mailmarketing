window.Admin = (function() {
    async function loadUsers() {
        try {
            const resp = await fetch(ServerConfig.get().baseUrl + '/users', {
                headers: { 'Authorization': `Bearer ${ServerConfig.get().authToken}` }
            });
            if (!resp.ok) throw new Error('Failed to load');
            const users = await resp.json();
            const tbody = document.getElementById('userTable').querySelector('tbody');
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${u.id}</td><td>${u.username}</td><td>${u.role}</td>`;
                const delBtn = document.createElement('button');
                delBtn.textContent = 'Löschen';
                delBtn.addEventListener('click', () => deleteUser(u.id));
                const td = document.createElement('td');
                td.appendChild(delBtn);
                tr.appendChild(td);
                tbody.appendChild(tr);
            });
        } catch (err) {
            document.getElementById('userError').textContent = 'Fehler beim Laden';
            console.error('loadUsers', err);
        }
    }

    async function deleteUser(id) {
        if (!confirm('Benutzer wirklich löschen?')) return;
        try {
            const resp = await fetch(ServerConfig.get().baseUrl + `/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${ServerConfig.get().authToken}` }
            });
            if (resp.ok) {
                document.getElementById('userMessage').textContent = 'Benutzer gelöscht';
                loadUsers();
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            document.getElementById('userError').textContent = 'Löschen fehlgeschlagen';
            console.error('deleteUser', err);
        }
    }

    async function createUser(username, password, role) {
        const msgEl = document.getElementById('userMessage');
        const errEl = document.getElementById('userError');
        msgEl.textContent = '';
        errEl.textContent = '';
        try {
            const resp = await fetch(ServerConfig.get().baseUrl + '/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ServerConfig.get().authToken}`
                },
                body: JSON.stringify({ username, password, role })
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data.error || 'Failed');
            }
            msgEl.textContent = 'Benutzer angelegt';
            document.getElementById('createUserForm').reset();
            loadUsers();
        } catch (err) {
            errEl.textContent = err.message || 'Anlegen fehlgeschlagen';
            console.error('createUser', err);
        }
    }

    return { loadUsers, createUser };
})();

document.addEventListener('DOMContentLoaded', () => {
    Admin.loadUsers();
    document.getElementById('createUserForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('newUserUsername').value;
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;
        Admin.createUser ? Admin.createUser(username, password, role) : createUser(username, password, role);
    });
});
