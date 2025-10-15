const bcrypt = require('bcrypt');

class UserModel {
    constructor(db) {
        this.db = db;
    }

    findByUsername(username) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username, password_plain, password_hash FROM users WHERE username = ? LIMIT 1';
            this.db.get(query, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    create(username, password, useHash = true) {
        return new Promise((resolve, reject) => {
            this.findByUsername(username).then(existingUser => {
                if (existingUser) {
                    reject(new Error('Nom d\'utilisateur déjà pris'));
                    return;
                }

                let query, params;
                
                if (useHash) {
                    const saltRounds = 12;
                    const hashedPassword = bcrypt.hashSync(password, saltRounds);
                    query = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
                    params = [username, hashedPassword];
                } else {
                    query = 'INSERT INTO users (username, password_plain) VALUES (?, ?)';
                    params = [username, password];
                }

                this.db.run(query, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({
                            id: this.lastID,
                            username: username
                        });
                    }
                });
            }).catch(reject);
        });
    }

    verifyCredentials(username, password) {
        return new Promise((resolve, reject) => {
            this.findByUsername(username).then(user => {
                if (!user) {
                    resolve(null); 
                    return;
                }

                const validPlain = user.password_plain && user.password_plain === password;
                const validHash = user.password_hash && bcrypt.compareSync(password, user.password_hash);

                if (validPlain || validHash) {
                    resolve({
                        id: user.id,
                        username: user.username
                    });
                } else {
                    resolve(null);
                }
            }).catch(reject);
        });
    }

    findById(id) {
        return new Promise((resolve, reject) => {
            const query = 'SELECT id, username FROM users WHERE id = ? LIMIT 1';
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }
}

module.exports = UserModel;
