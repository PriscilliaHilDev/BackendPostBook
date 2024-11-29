const mongoose = require('mongoose');

// Définition du schéma pour l'utilisateur
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { 
    type: String, 
    required: function() { return !this.googleId; }  // Obligatoire uniquement si pas d'OAuth
  },
  googleId: { type: String, required: false, unique: true },  // Facultatif pour les utilisateurs du formulaire
  picture: { type: String, required: false }, // Facultatif pour tous les utilisateurs
  refreshToken: { type: String }, // Facultatif
  resetPasswordToken: { type: String }, // Token de réinitialisation (facultatif)
  resetPasswordExpires: { type: Date },  // Expiration du token de réinitialisation (facultatif)
}, { timestamps: true });

// Création du modèle basé sur le schéma
const User = mongoose.model('User', userSchema);

module.exports = User;
