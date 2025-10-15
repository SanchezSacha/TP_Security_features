const rateLimit = require('express-rate-limit');

// Configuration du rate limiting pour les connexions
const loginLimiter = rateLimit({
    windowMs: 30 * 1000, // 30 secondes
    max: 3, // Maximum 3 tentatives
    message: 'Trop de tentatives de connexion. Réessayez dans 30 secondes.',
    standardHeaders: true,
    legacyHeaders: false,
    delayMs: 1000,
    handler: (req, res, next, options) => {
        const blockedUntil = Date.now() + 30 * 1000;
        return res.status(429).render('login', {
            message: options.message,
            blockedUntil
        });
    }
});

// Configuration du rate limiting pour les inscriptions
const registerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Maximum 5 tentatives d'inscription par minute
    message: 'Trop de tentatives d\'inscription. Réessayez dans 1 minute.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        return res.status(429).render('register', {
            message: options.message,
            username: req.body.username || ''
        });
    }
});

// Middleware pour vérifier si l'utilisateur est connecté
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

// Middleware pour vérifier si l'utilisateur est déjà connecté (pour éviter de revenir sur login/register)
const requireGuest = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    } else {
        return next();
    }
};

// Middleware pour ajouter les informations de l'utilisateur connecté aux variables locales
const addUserToLocals = (req, res, next) => {
    res.locals.user = req.session && req.session.user ? req.session.user : null;
    next();
};

// Middleware pour valider les données d'inscription
const validateRegistration = (req, res, next) => {
    const { username, password, confirmPassword } = req.body;
    const errors = [];

    // Validation du nom d'utilisateur
    if (!username || username.trim().length < 3) {
        errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
    }

    if (username && username.length > 50) {
        errors.push('Le nom d\'utilisateur ne peut pas dépasser 50 caractères');
    }

    // Validation du mot de passe
    if (!password || password.length < 6) {
        errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (password !== confirmPassword) {
        errors.push('Les mots de passe ne correspondent pas');
    }

    if (errors.length > 0) {
        return res.render('register', {
            message: errors.join(', '),
            username: username || ''
        });
    }

    next();
};

module.exports = {
    loginLimiter,
    registerLimiter,
    requireAuth,
    requireGuest,
    addUserToLocals,
    validateRegistration
};
