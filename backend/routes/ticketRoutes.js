const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/ticketController");
const auth = require("../middleware/authMiddleware");
const val  = require("../middleware/validateMiddleware");
const db   = require("../config/db");

// GET /tickets — accessible sans auth pour agents/admin, filtre par jour
router.get   ("/",              ctrl.getAll);

// GET /tickets/my — tickets de l'utilisateur connecté
router.get("/my", auth(), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const [rows] = await db.query(
      `SELECT t.*, s.name AS service_name, s.prefix 
       FROM tickets t 
       JOIN services s ON t.service_id=s.id 
       WHERE (t.email=? OR t.assigned_agent_id=?)
         AND DATE(t.created_at)=CURDATE()
       ORDER BY t.created_at DESC`,
      [userEmail, userId]
    );
    res.json({ success: true, data: rows, total: rows.length });
  } catch (e) { next(e); }
});

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
