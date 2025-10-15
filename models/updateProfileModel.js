const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../data/app.db');

function updateUser(id, username, description, avatar_url, callback) {
    const db = new sqlite3.Database(dbPath);
    const query = 'UPDATE users SET username = ?, description = ?, avatar_url = ? WHERE id = ?';
    const params = [username, description, avatar_url, id];

    db.run(query, params, function (err) {
        if (err) {
            console.error('Erreur lors de la mise à jour du profil :', err.message);
            callback(err);
        } else {
            console.log(`Profil mis à jour`);
            callback(null, { changes: this.changes });
        }
    });

    db.close();
}

function getUserById(id, callback) {
    const db = new sqlite3.Database(dbPath);
    const query = 'SELECT * FROM users WHERE id = ?';

    db.get(query, [id], (err, row) => {
        if (err) {
            callback(err);
        } else {
            callback(null, row); // row contient l'utilisateur ou undefined
        }
    });

    db.close();
}

module.exports = { updateUser, getUserById };