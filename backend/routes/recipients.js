const express = require('express');
const { db } = require('../models/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/recipients', verifyToken, (req, res) => {
    db.all('SELECT id, name, email, tags, status, created_at FROM recipients WHERE user_id = ?', [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        rows.forEach(r => {
            r.tags = r.tags ? JSON.parse(r.tags) : null;
        });
        res.json(rows);
    });
});

router.post('/recipients', verifyToken, (req, res) => {
    const { name, email, tags, custom_fields } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const stmt = db.prepare('INSERT INTO recipients (user_id, name, email, tags, custom_fields) VALUES (?, ?, ?, ?, ?)');
    stmt.run(req.user.id, name || null, email, tags ? JSON.stringify(tags) : null, custom_fields ? JSON.stringify(custom_fields) : null, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, email, tags, status: 'active', created_at: new Date().toISOString() });
    });
    stmt.finalize();
});

router.delete('/recipients/:id', verifyToken, (req, res) => {
    const stmt = db.prepare('DELETE FROM recipients WHERE id = ? AND user_id = ?');
    stmt.run(req.params.id, req.user.id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Recipient deleted' });
    });
    stmt.finalize();
});

module.exports = router;
