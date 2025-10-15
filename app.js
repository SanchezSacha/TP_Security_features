const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const engine = require('ejs-locals');
const xss = require('xss');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme-local-only';
const basicAuth = require('express-basic-auth');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const app = express();
const helmet = require('helmet');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

// Import des routes et middlewares
const createAuthRoutes = require('./routes/authRoute');
const { addUserToLocals, requireAuth } = require('./middlewares/baseAuth');

app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    name: 'sessionId',
    secret: process.env.SESSION_SECRET || 'secret-local-only',
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: path.join(__dirname, 'data')
    }),
    rolling: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 30
    }
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
const csrfProtection = csrf({ cookie: true });
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken ? req.csrfToken() : null;
    next();
});
app.use(addUserToLocals); // Ajouter les infos utilisateur aux variables locales
app.use(helmet());

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
    }
}));

app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
//HSTS (Strict-Transport-Security) — n'activer qu'en prod HTTPS
// app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true, preload: true }));



const DB_PATH = path.join(__dirname, 'data', 'app.db');
// const initSql = fs.readFileSync(path.join(__dirname, 'scripts/init_db.sql'), 'utf8');


if (!fs.existsSync(path.join(__dirname, 'data'))) fs.mkdirSync(path.join(__dirname, 'data'));



const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Cannot open DB:", err);
        process.exit(1);
    }
    console.log("SQLite DB opened:", DB_PATH);
});

// Configuration des routes d'authentification
app.use('/', createAuthRoutes(db));


app.get('/', (req, res) => {
    db.all("SELECT id, title, body FROM posts ORDER BY id DESC LIMIT 50", [], (err, rows) => {
        if (err) return res.status(500).send('DB error');
        res.render('index', { posts: rows });
    });
});

app.get('/post', requireAuth, csrfProtection, (req, res) => {
    res.render('post', { csrfToken: req.csrfToken() });
});

app.post('/post', requireAuth, csrfProtection, (req, res) => {
    const title = req.body.title ? String(req.body.title).trim() : '';
    const body  = req.body.body ? xss(String(req.body.body)) : '';
    const sql = 'INSERT INTO posts (title, body) VALUES (?, ?)';
    db.run(sql, [title, body], function(err) {
        if (err) {
            console.error("DB insert error:", err);
            return res.status(500).send('DB error');
        }
        res.redirect('/');
    });
});

app.get('/search', (req, res) => {
    let q = req.query.q || '';
    q = String(q).slice(0, 200).trim();
    const like = `%${q}%`;
    const sql = 'SELECT id, title, body FROM posts WHERE title LIKE ? OR body LIKE ? LIMIT 100';
    db.all(sql, [like, like], (err, rows) => {
        if (err) {
            console.error('Search DB error:', err);
            return res.status(500).send('DB error');
        }
        res.render('search', { q, results: rows });
    });
});


const adminUsers = { [process.env.ADMIN_USER || 'admin']: process.env.ADMIN_PASS || 'localpass' };
app.use('/reset-db', basicAuth({ users: adminUsers, challenge: true }));

app.get('/reset-db', (req, res) => {
    const init = fs.readFileSync(path.join(__dirname, 'scripts', 'init_db.sql'), 'utf8');
    db.exec(init, (err) => {
        if (err) return res.status(500).send('DB init error');
        res.send('DB reset done. <a href="/">Home</a>');
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`VULNERABLE app listening on http://127.0.0.1:${PORT}`);
});
