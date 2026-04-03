const { validationResult } = require("express-validator");
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ error: "Donnees invalides", details: errors.array() });
  next();
};
