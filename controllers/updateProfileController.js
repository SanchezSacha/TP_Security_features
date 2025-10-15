const { updateUser } = require('../models/updateProfileModel');

function getUserController(req, res) {
    const id = Number(req.params.id);

    getUserById(id, (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erreur serveur');
        }

        if (!user) {
            return res.status(404).send('Utilisateur introuvable');
        }

        // On envoie les infos de l'utilisateur à la vue pour pré-remplir le formulaire
        res.render('profil', { user, message: null });
    });
}

function updateUserController(req, res) {
    const { id, username, description, avatar_url } = req.body;

    updateUser(id, username, description, avatar_url, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
        } else if (result.changes === 0) {
            res.status(404).json({ message: 'Utilisateur introuvable' });
        } else {
            res.status(200).json({ message: 'Profil mis à jour avec succès' });
        }
    });
}

module.exports = { updateUserController, getUserController };
