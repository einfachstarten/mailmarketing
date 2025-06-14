const express = require('express');
const path = require('path');
const pino = require('pino');
const pinoHttp = require('pino-http');
const fs = require('fs');
const { init } = require('./models/database');
const cors = require('./middleware/cors');

const authRoutes = require('./routes/auth');
const recipientsRoutes = require('./routes/recipients');
const usersRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');

const app = express();
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const PORT = process.env.PORT || 8080;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

init();

app.use(pinoHttp({ logger }));
app.use(cors);
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

app.use(authRoutes);
app.use(recipientsRoutes);
app.use(usersRoutes);
app.use(uploadRoutes);

app.use((err, req, res, next) => {
    logger.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${PORT}`);
});
