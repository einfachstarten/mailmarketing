const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pino = require('pino');
const pinoHttp = require('pino-http');
const session = require('express-session');
const { execSync } = require('child_process');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
app.use(pinoHttp({ logger }));
const PORT = process.env.PORT;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.sqlite');
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'secret-token';
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join('/data', 'uploads');
const UPLOAD_TTL_DAYS = parseInt(process.env.UPLOAD_TTL_DAYS || '14', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const SESSION_SECRET = process.env.SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let VERSION = 'dev';
try {
    const pkg = require('./package.json');
    const commit = execSync('git rev-parse --short HEAD').toString().trim();
    let dirty = '';
    try {
        if (execSync('git status --porcelain').toString().trim()) {
            dirty = '-dirty';
        }
    } catch {}
    const date = new Date().toISOString().split('T')[0];
    VERSION = `${pkg.version} (${commit}${dirty}, ${date})`;
} catch (e) {
    logger.warn({ err: e }, 'Failed to determine git version');
}

function cleanupOldUploads() {
    fs.readdir(UPLOAD_DIR, (err, files) => {
        if (err) {
            logger.error({ err }, 'Failed to read upload directory');
            return;
        }
        const now = Date.now();
        const cutoff = now - UPLOAD_TTL_DAYS * 24 * 60 * 60 * 1000;
        files.forEach(file => {
            const filePath = path.join(UPLOAD_DIR, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    logger.error({ err, file: filePath }, 'Stat failed');
                    return;
                }
                if (stats.mtimeMs < cutoff) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            logger.error({ err, file: filePath }, 'Failed to remove old upload');
                        } else {
                            logger.info({ file: filePath }, 'Removed expired upload');
                        }
                    });
                }
            });
        });
    });
}

cleanupOldUploads();
setInterval(cleanupOldUploads, 24 * 60 * 60 * 1000);

app.use(express.json());
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // only over HTTPS
        maxAge: 60 * 60 * 1000
    }
}));
app.use('/uploads', express.static(UPLOAD_DIR));

function authMiddleware(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (auth === `Bearer ${AUTH_TOKEN}`) {
        return next();
    }
    if (auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.user = payload;
            return next();
        } catch (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    }
    return res.status(401).json({ error: 'Unauthorized' });
}

function adminOnly(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
}


const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS recipients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        status TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )`);
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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

app.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ success: true, data: { filename: req.file.filename, url } });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
        stmt.run(username, hash, function(err) {
            if (err) {
                return res.status(400).json({ error: 'User exists' });
            }
            res.json({ id: this.lastID, username });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.json({ token });
    });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/users', authMiddleware, adminOnly, (req, res) => {
    db.all('SELECT id, username, role FROM users', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/users', authMiddleware, adminOnly, async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
        stmt.run(username, hash, role || 'user', function(err) {
            if (err) {
                return res.status(400).json({ error: 'User exists' });
            }
            res.json({ id: this.lastID, username, role: role || 'user' });
        });
        stmt.finalize();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/users/:id', authMiddleware, adminOnly, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
    stmt.finalize();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/version.txt', (req, res) => {
    res.type('text/plain').send(VERSION);
});

app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${PORT}`);
});
