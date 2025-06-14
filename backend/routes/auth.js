const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../models/database');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const SALT_ROUNDS = 12;

router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        stmt.run(username, hash, function(err) {
            if (err) {
                return res.status(400).json({ error: 'User exists' });
            }
            res.json({ message: 'User created' });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

router.post('/logout', (req, res) => {
    // stateless JWT logout
    res.json({ message: 'Logged out' });
});

module.exports = router;
