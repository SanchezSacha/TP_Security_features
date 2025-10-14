DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS posts;

CREATE TABLE users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   username TEXT UNIQUE,
   password_plain TEXT,
   password_hash TEXT
);

CREATE TABLE posts (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   title TEXT,
   body TEXT
);

INSERT INTO users (username, password_plain, password_hash) VALUES ('admin', 'admin', '');
INSERT INTO users (username, password_plain, password_hash) VALUES ('nathan', '', '');
INSERT INTO posts (title, body) VALUES ('Welcome', 'Bienvenue sur le mini-blog de fou furieux.');
INSERT INTO posts (title, body) VALUES ('Règles', 'Aucune règle c''est pas mal non plus.');
