const express = require('express');
const { getUserController, updateUserController } = require('../controllers/updateProfileController');

const router = express.Router();

// GET → afficher le profil
router.get('/profil/:id', getUserController);

// PUT → modifier le profil
router.put('/profil/:id', updateUserController);

module.exports = router;
