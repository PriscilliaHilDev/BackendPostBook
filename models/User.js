const mongoose = require('mongoose');

// Définition du schéma pour l'utilisateur
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });

// Création du modèle basé sur le schéma
const User = mongoose.model('User', userSchema);

// Exportation du modèle User
module.exports = User;
