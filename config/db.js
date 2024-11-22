require('dotenv').config();  // Charger les variables d'environnement
const mongoose = require('mongoose');
const User = require('../models/User');  // Assure-toi que le chemin est correct

// Fonction pour se connecter à MongoDB
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MongoDB URI is not defined in the .env file");
    process.exit(1);  
  }

  try {
    await mongoose.connect(process.env.MONGO_URI); // Connexion sans options supplémentaires
    console.log("MongoDB connected successfully");

    // Une fois connecté, récupère et affiche les utilisateurs
    // await getUsers(); // Appeler la fonction pour obtenir et afficher les utilisateurs
  } catch (error) {
    console.error("Error connecting to MongoDB", error.message);
    process.exit(1); // Quitte le processus si la connexion échoue
  }
};

// Fonction pour récupérer et afficher les utilisateurs
// const getUsers = async () => {
//   try {
//     const users = await User.find();  // Récupérer tous les utilisateurs
//     console.log("Users:", users);  // Afficher les utilisateurs dans la console
//   } catch (error) {
//     console.error("Error fetching users:", error.message);
//   }
// };

module.exports = connectDB;
