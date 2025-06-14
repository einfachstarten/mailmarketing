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
                tr.innerHTML = `<td>${u.id}</td><td>${u.email}</td><td>${u.role}</td>`;
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
                loadUsers();
            } else {
                throw new Error('Failed');
            }
        } catch (err) {
            alert('Löschen fehlgeschlagen');
            console.error('deleteUser', err);
        }
    }

    return { loadUsers };
})();

document.addEventListener('DOMContentLoaded', () => {
    Admin.loadUsers();
});
