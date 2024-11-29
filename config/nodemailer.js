const nodemailer = require('nodemailer');

// Crée une instance de transporteur avec les paramètres SMTP d'Outlook
// const transporter = nodemailer.createTransport({
//   service: 'hotmail', // Pour Outlook ou Hotmail, tu peux aussi utiliser 'outlook'
//   auth: {
//     user: process.env.OUTLOOK_EMAIL, // Ton email Outlook
//     pass: process.env.OUTLOOK_PASSWORD, // Ton mot de passe Outlook
//   },
// });


// Configurer le transporteur avec les informations Ethereal
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'norene.ohara19@ethereal.email',
      pass: 'TD6k3uedSKrygHwDdM',
    },
  });

module.exports = transporter;
