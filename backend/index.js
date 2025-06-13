const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.sqlite');
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'secret-token';

app.use(express.json());

function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth || auth !== `Bearer ${AUTH_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        status TEXT
    )`);
});

app.get('/recipients', (req, res) => {
    db.all('SELECT id, name, email, status FROM recipients', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/recipients', authMiddleware, (req, res) => {
    const { name, email, status } = req.body;
    const stmt = db.prepare('INSERT INTO recipients (name, email, status) VALUES (?, ?, ?)');
    stmt.run(name, email, status || 'pending', function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, email, status: status || 'pending' });
    });
    stmt.finalize();
});

app.delete('/recipients/:id', authMiddleware, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM recipients WHERE id = ?');
    stmt.run(id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
    stmt.finalize();
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
