const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const transporter = require('../config/nodemailer'); // Assure-toi que tu as configuré ton Nodemailer pour Outlook


const client = new OAuth2Client(`${process.env.GOOGLE_OAUTH_APP_GUID}.apps.googleusercontent.com`);

// authentifier l'utilisateur avec google
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  try {
    // Vérifier l'idToken avec Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: `${process.env.GOOGLE_OAUTH_APP_GUID}.apps.googleusercontent.com`,
    });

    const payload = ticket.getPayload(); // Informations utilisateur de Google
    console.log('Payload:', payload); // Vérifie le contenu de payload
    const { email, name, sub: googleId, picture } = payload; // Renommé sub en googleId

    // Validation des données
    if (!email || !name || !googleId) {
      return res.status(400).json({ message: 'Données utilisateur manquantes' });
    }

    // Chercher l'utilisateur dans la base de données avec l'email
    let user = await User.findOne({ email });

    if (!user) {
      // Si l'utilisateur n'existe pas, créer un nouveau compte Google
      user = new User({
        email,
        name,
        googleId,
        picture,
      });
      await user.save();
    } else if (!user.googleId) {
      // Si l'utilisateur existe mais n'a pas encore de googleId, on fusionne les comptes
      user.googleId = googleId;
      user.picture = picture; // Mettre à jour la photo si disponible
      await user.save();
    }

    // Génération des tokens
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Sauvegarde des tokens dans la base de données
    user.refreshToken = refreshToken;
    await user.save();

    // Réponse
    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token Google:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// inscription d'un nouvel utilisateur
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Données reçues:', req.body); // Vérifie que les données arrivent correctement

  try {
    // Vérification si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Utilisateur déjà existant');
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Génération du refreshToken
    const refreshToken = jwt.sign({ userId: email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Création du nouvel utilisateur avec les champs nécessaires, incluant le refreshToken
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      googleId: null,  // Valeur par défaut
      picture: null,   // Valeur par défaut
      refreshToken : refreshToken,    // Ajouter directement le refreshToken
      resetPasswordToken: null,  // Valeur par défaut
      resetPasswordExpires: null,  // Valeur par défaut
    });

    // Sauvegarde du nouvel utilisateur dans la base de données
    await newUser.save();
    console.log('Utilisateur enregistré:', newUser);

    // Génération de l'accessToken
    const accessToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Réponse avec les tokens et les informations utilisateur
    res.json({
      message: 'Nouvel utilisateur créé',
      tokens: {
        accessToken,
        refreshToken,
      },
      user: {
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Fonction pour connecter un utilisateur
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('Tentative de connexion:', { email });

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

      // Générer un access token et un refresh token
      const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      // Stocker le refresh token dans la base de données 
      user.refreshToken = refreshToken;
      await user.save();

      // Répondre avec les tokens et les informations utilisateur
      res.json({
          message: 'Connexion réussie',
          tokens: {
              accessToken,
              refreshToken,
          },
          user: {
              name: user.name, // Ajouter le nom de l'utilisateur si tu veux l'envoyer
              email: user.email,
          },
      });
  } catch (error) {
      console.error('Erreur serveur lors de la tentative de connexion:', error);
      res.status(500).json({
          message: 'Erreur serveur',
          error: error.message || 'Une erreur inconnue est survenue',
      });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Vérifier si le refresh token existe
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token manquant' });
    }

    // Vérifier et décoder le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Chercher l'utilisateur à partir de l'id décodé
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier que le refresh token correspond à celui stocké
    if (user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Refresh token invalide' });
    }

    // Générer un nouveau access token
    const newAccessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Fonction pour la demande de réinitialisation du mot de passe
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Ajouter un délai d'expiration au token (1 heure)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    // Créer un lien de réinitialisation
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Options de l'e-mail
    const mailOptions = {
      to: user.email,
      subject: 'Réinitialisation du mot de passe',
      text: `Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien suivant pour le faire : ${resetLink}`,
    };

    // Envoyer l'e-mail de réinitialisation via Outlook
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'E-mail de réinitialisation envoyé' });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const logoutUser = async (req, res) => {
  const { userId } = req.body;

  try {
    // Trouver l'utilisateur et révoquer le refresh token
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Réinitialiser le refresh token
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  refreshToken,
  logoutUser,
  forgotPassword
};
