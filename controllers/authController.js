const UserModel = require('../models/userModel');

class AuthController {
    constructor(db) {
        this.userModel = new UserModel(db);
    }

    showLogin = (req, res) => {
        res.render('login', { message: null });
    }

    processLogin = async (req, res) => {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.render('login', { message: 'Veuillez remplir tous les champs' });
            }

            const user = await this.userModel.verifyCredentials(username.trim(), password);
            
            if (!user) {
                return res.render('login', { message: 'Identifiants incorrects' });
            }

            req.session.regenerate((err) => {
                if (err) {
                    console.error('Erreur régénération session:', err);
                    return res.status(500).send('Erreur de session');
                }
                
                req.session.user = {
                    id: user.id,
                    username: user.username
                };
                
                return res.send(`<h3>Connecté en tant que ${user.username}</h3>
                              <br><a href="/">Retour à l'accueil</a>`);
            });

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return res.status(500).render('login', { 
                message: 'Erreur serveur lors de la connexion' 
            });
        }
    }

    showRegister = (req, res) => {
        res.render('register', { 
            message: null, 
            username: '' 
        });
    }

    processRegister = async (req, res) => {
        try {
            const { username, password } = req.body;

            const newUser = await this.userModel.create(username.trim(), password, true);
            
            req.session.regenerate((err) => {
                if (err) {
                    console.error('Erreur régénération session:', err);
                    return res.status(500).send('Erreur de session');
                }
                
                req.session.user = {
                    id: newUser.id,
                    username: newUser.username
                };
                
                return res.send(`<h3>Inscription réussie ! Bienvenue ${newUser.username}</h3>
                              <br><a href="/">Retour à l'accueil</a>`);
            });

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            let message = 'Erreur lors de l\'inscription';
            
            if (error.message === 'Nom d\'utilisateur déjà pris') {
                message = error.message;
            }
            
            return res.render('register', { 
                message: message,
                username: req.body.username || ''
            });
        }
    }

    logout = (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Erreur destruction session:', err);
            }
            res.clearCookie('sessionId');
            res.redirect('/login');
        });
    }
}

module.exports = AuthController;