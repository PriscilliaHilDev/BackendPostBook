const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');

// Charger les variables d'environnement
dotenv.config();

// Connexion à la base de données MongoDB
connectDB();

const app = express();

// Middleware pour analyser le corps des requêtes en JSON
app.use(cors());
app.use(express.json());

// Définir les routes pour l'API
app.use('/api', userRoutes); // Ajouter /api devant toutes les routes utilisateur

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
