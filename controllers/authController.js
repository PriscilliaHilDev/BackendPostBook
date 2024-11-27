const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Fonction pour enregistrer un nouvel utilisateur
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
  
    console.log('Données reçues:', req.body); // Vérifie que les données arrivent correctement
  
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('Utilisateur déjà existant');
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
      });
  
      await newUser.save();
      console.log('Utilisateur enregistré:', newUser);
      res.status(201).json({ message: 'Utilisateur créé avec succès' });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
  };
  

// Fonction pour connecter un utilisateur
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log('Tentative de connexion:', { email }); // Log l'email envoyé par le client
  
    try {
      // Recherche l'utilisateur par email
      const user = await User.findOne({ email });
      if (!user) {
        console.log(`Utilisateur non trouvé avec l'email: ${email}`);
        return res.status(400).json({ message: 'Identifiants invalides' });
      }
  
      console.log('Utilisateur trouvé:', { userId: user._id, email: user.email });
  
      // Vérification du mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log(`Mot de passe incorrect pour l'utilisateur ${user.email}`);
        return res.status(400).json({ message: 'Identifiants invalides' });
      }
  
      console.log('Mot de passe validé avec succès');
  
      // Générer un token JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log('Token généré avec succès:', token);  // Il est recommandé de ne pas loguer les tokens en production
  
      // Répondre avec le token
      res.json({ token });
  
    } catch (error) {
      console.error('Erreur serveur lors de la tentative de connexion:', error);
      res.status(500).json({ message: 'Erreur serveur', error });
    }
  };
  

module.exports = {
  registerUser,
  loginUser,
};
