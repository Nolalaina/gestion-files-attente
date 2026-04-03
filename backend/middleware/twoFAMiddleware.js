const nodemailer = require('nodemailer');

// Configuration Email (à adapter avec votre provider)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Générer un code 2FA aléatoire (6 chiffres)
const generateTwoFACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Envoyer l'email 2FA
const sendTwoFAEmail = async (email, code) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'noreply@fileattente.mg',
      to: email,
      subject: 'Votre code de vérification 2FA - FileAttente',
      html: `
        <h2>Vérification en deux étapes</h2>
        <p>Votre code de vérification est :</p>
        <h1 style="font-size: 36px; letter-spacing: 10px; color: #007bff;">${code}</h1>
        <p>Ce code expire dans 5 minutes.</p>
        <p><strong>Ne partagez ce code avec personne.</strong></p>
        <hr>
        <p style="color: #666; font-size: 12px;">Si vous n'avez pas demandé cette vérification, ignorez cet email.</p>
      `,
      text: `Votre code 2FA est: ${code}. Il expire dans 5 minutes.`,
    });
    return true;
  } catch (error) {
    console.error('Erreur envoi email 2FA:', error);
    return false;
  }
};

// Middleware pour vérifier le code 2FA
const verify2FACode = (req, res, next) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code || code.length !== 6) {
    return res.status(400).json({ error: 'Code invalide' });
  }

  // Vérification côté base de données (dans le controller)
  req.two_fa_code = code;
  next();
};

// Middleware pour forcer 2FA si activé
const require2FA = (req, res, next) => {
  if (req.user.two_fa_enabled && !req.user.two_fa_verified) {
    return res.status(403).json({ error: '2FA requis', needs_2fa: true });
  }
  next();
};

module.exports = {
  generateTwoFACode,
  sendTwoFAEmail,
  verify2FACode,
  require2FA,
  transporter,
};
