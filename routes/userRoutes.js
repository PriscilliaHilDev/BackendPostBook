const express = require('express');
const { getUsers, createUser } = require('../controllers/userController');

const router = express.Router();

// Route pour récupérer tous les utilisateurs
router.get('/users', getUsers); 

// Route pour créer un nouvel utilisateur
router.post('/new-user', createUser); 

module.exports = router;
