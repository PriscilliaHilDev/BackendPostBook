const express = require('express');
const { registerUser, loginUser, googleLogin, refreshToken, logoutUser, forgotPassword} = require('../controllers/authController'); // Import depuis authController.js
const { getUsers } = require('../controllers/userController'); // Import depuis userController.js

const router = express.Router();

// Route pour enregistrer un utilisateur
router.post('/register', registerUser);

// Route pour connecter un utilisateur via mot de passe
router.post('/login', loginUser);

router.post('/refresh-token', refreshToken);

router.post('/logout', logoutUser);

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', forgotPassword); 

// Route pour connecter un utilisateur via Google
router.post('/google-login', googleLogin);  // <-- Ajouter cette ligne pour gérer la connexion Google

router.get('/test', (req, res) => {
    res.send('test reussi');
});

router.get('/users', getUsers);

module.exports = router; 
