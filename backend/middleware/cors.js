const cors = require('cors');

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://your-app.fly.dev'
    ],
    credentials: true
};

module.exports = cors(corsOptions);
