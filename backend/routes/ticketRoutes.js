const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/ticketController");
const auth = require("../middleware/authMiddleware");
const val  = require("../middleware/validateMiddleware");
router.get   ("/",              auth(),              ctrl.getAll);
router.get   ("/:id",                               ctrl.getOne);
router.post  ("/",
  [body("user_name").notEmpty().trim(), body("service_id").isInt({ min:1 })], val,
  ctrl.create);
router.patch ("/:id/call",      auth(["agent","admin"]), ctrl.call);
router.patch ("/:id/serve",     auth(["agent","admin"]), ctrl.serve);
router.patch ("/:id/complete",  auth(["agent","admin"]), ctrl.complete);
router.patch ("/:id/absent",    auth(["agent","admin"]), ctrl.absent);
router.patch ("/:id/reassign",  auth(["admin"]),         ctrl.reassign);
router.delete("/:id",           auth(),              ctrl.cancel);
module.exports = router;
