const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { body } = require("express-validator");
const db      = require("../config/db");
const val     = require("../middleware/validateMiddleware");
const auth    = require("../middleware/authMiddleware");
const { sendTwoFAEmail } = require("../middleware/twoFAMiddleware");
const { logActivity } = require("../utils/logger");

router.post("/register",
  [
    body("firstName").isLength({ min: 2 }),
    body("lastName").isLength({ min: 2 }),
    body("email").isEmail(),
    body("phone").isMobilePhone("any"),
    body("password").isLength({ min: 6 }),
    body("confirmPassword").custom((value, { req }) => value === req.body.password),
  ], val,
  async (req, res, next) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;
      const [[exists]] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
      if (exists) return res.status(409).json({ error: "Email déjà utilisé" });

      const emailToken = crypto.randomBytes(20).toString("hex");
      const passwordHash = await bcrypt.hash(password, 10);

      await db.query(
        "INSERT INTO users (name, email, password, role, phone, active, is_verified, email_verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [`${firstName} ${lastName}`, email, passwordHash, 'usager', phone, 1, 1, null]
      );

      const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${emailToken}`;
      const emailSent = await sendTwoFAEmail(email, `Votre code de vérification : ${emailToken}\nCliquez : ${verificationUrl}`);

      await logActivity({
        action: "USER_REGISTER",
        req,
        description: `Inscription de ${firstName} ${lastName} (${email})`
      });

      res.status(201).json({
        success: true,
        message: emailSent 
          ? "Inscription réussie, vérifiez votre email pour activer le compte" 
          : "Inscription réussie, mais l'envoi de l'email a échoué. Contactez le support.",
        verifyUrl: verificationUrl, // Utile pour le dev si l'email ne part pas
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post("/verify-email",
  [body("token").notEmpty()], val,
  async (req, res, next) => {
    try {
      const { token } = req.body;
      const [[user]] = await db.query("SELECT id FROM users WHERE email_verification_token = ?", [token]);
      if (!user) return res.status(400).json({ error: "Token invalide ou expiré" });
      await db.query("UPDATE users SET is_verified=1, active=1, email_verification_token=NULL WHERE id = ?", [user.id]);
      
      await logActivity({
        userId: user.id,
        action: "EMAIL_VERIFIED",
        req,
        description: `Email vérifié pour utilisateur #${user.id}`
      });

      res.json({ success: true, message: "Email vérifié, vous pouvez maintenant vous connecter." });
    } catch (e) {
      next(e);
    }
  }
);

router.post("/login",
  [body("email").isEmail(), body("password").notEmpty()], val,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [[user]] = await db.query("SELECT * FROM users WHERE email=? AND active=1", [email]);
      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).json({ error: "Identifiants incorrects" });
      if (user.is_verified === 0) return res.status(403).json({ error: "Email non vérifié" });
      const token = jwt.sign(
        { id: user.id, role: user.role, name: user.name, email: user.email },
        process.env.JWT_SECRET || "dev_secret", { expiresIn: "10h" });

      await logActivity({
        userId: user.id,
        action: "USER_LOGIN",
        req,
        description: `Connexion réussie : ${user.name} (${user.role})`
      });

      res.json({ success: true, token,
        user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (e) { next(e); }
  }
);

router.get("/me", auth(), async (req, res, next) => {
  try {
    const [[u]] = await db.query(
      "SELECT id,name,email,role,phone,created_at FROM users WHERE id=?", [req.user.id]);
    res.json({ success: true, data: u });
  } catch (e) { next(e); }
});

router.post("/change-password", auth(),
  [body("current").notEmpty(), body("newPassword").isLength({ min:6 })], val,
  async (req, res, next) => {
    try {
      const [[u]] = await db.query("SELECT password FROM users WHERE id=?", [req.user.id]);
      if (!(await bcrypt.compare(req.body.current, u.password)))
        return res.status(400).json({ error: "Mot de passe actuel incorrect" });
      await db.query("UPDATE users SET password=? WHERE id=?",
        [await bcrypt.hash(req.body.newPassword, 10), req.user.id]);
      res.json({ success: true });
    } catch (e) { next(e); }
  }
);

module.exports = router;
