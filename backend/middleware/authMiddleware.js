const jwt = require("jsonwebtoken");
module.exports = (role) => (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return res.status(401).json({ error: "Token manquant" });
  try {
    const decoded = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    if (role) {
      const allowed = Array.isArray(role) ? role : [role];
      if (!allowed.includes(decoded.role) && decoded.role !== "admin")
        return res.status(403).json({ error: `Acces refuse - role requis: ${allowed.join("/")}` });
    }
    next();
  } catch (err) {
    res.status(401).json({ error: err.name === "TokenExpiredError" ? "Token expire" : "Token invalide" });
  }
};
