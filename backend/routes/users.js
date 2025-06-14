const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../models/database');
const { verifyToken, adminOnly } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 12;

router.get('/users', verifyToken, adminOnly, (req, res) => {
    db.all('SELECT id, username, role, created_at FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/users', verifyToken, adminOnly, async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ error: 'username, password and role required' });
    }
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
        stmt.run(username, hash, role, function(err) {
            if (err) return res.status(400).json({ error: 'User exists' });
            res.json({ id: this.lastID, username, role, created_at: new Date().toISOString() });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/users/:id', verifyToken, adminOnly, (req, res) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(req.params.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted' });
    });
    stmt.finalize();
});

module.exports = router;
