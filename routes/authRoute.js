const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { 
    loginLimiter, 
    registerLimiter, 
    requireGuest, 
    validateRegistration 
} = require('../middlewares/baseAuth');

function createAuthRoutes(db) {
    const authController = new AuthController(db);

    router.get('/login', requireGuest, authController.showLogin);
    router.post('/login', requireGuest, loginLimiter, authController.processLogin);
    router.get('/register', requireGuest, authController.showRegister);
    router.post('/register', requireGuest, registerLimiter, validateRegistration, authController.processRegister);
    router.get('/logout', authController.logout);

    return router;
}

module.exports = createAuthRoutes;
