const express = require('express');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { db } = require('../models/database');
const { verifyToken } = require('../middleware/auth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = crypto.randomBytes(8).toString('hex');
        cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
    }
});

function fileFilter(req, file, cb) {
    const allowed = [
        'application/pdf',
        'image/png', 'image/jpeg', 'image/gif',
        'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    cb(null, allowed.includes(file.mimetype));
}

const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter });

router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const stmt = db.prepare('INSERT INTO uploads (user_id, filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(req.user.id, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const url = `/uploads/${req.file.filename}`;
        res.json({ id: this.lastID, filename: req.file.filename, original_name: req.file.originalname, url, file_size: req.file.size, mime_type: req.file.mimetype });
    });
    stmt.finalize();
});

module.exports = router;
