const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController'); // Import depuis authController.js
const { getUsers  } = require('../controllers/userController'); // Import depuis authController.js

const router = express.Router();

// Route pour enregistrer un utilisateur
router.post('/register', registerUser);

// Route pour connecter un utilisateur
router.post('/login', loginUser);

router.get('/test', (req, res) => {
    res.send('test reussi');
  });

router.get('/users', getUsers);

module.exports = router;
