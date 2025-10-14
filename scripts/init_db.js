const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db');
if (!fs.existsSync(path.join(__dirname, '..', 'data'))) fs.mkdirSync(path.join(__dirname, '..', 'data'));
const sql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
const db = new sqlite3.Database(DB_PATH);

db.exec(sql, (err) => {
    if (err) { console.error(err); process.exit(1); }
    const hash = bcrypt.hashSync('teacherpass', 10);
    db.run("UPDATE users SET password_hash = ? WHERE username = 'teacher'", [hash], (e) => {
        if (e) console.error(e);
        else console.log('DB initialized with users and posts.');
        db.close();
    });
});
