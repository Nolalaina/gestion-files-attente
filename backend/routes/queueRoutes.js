const router = require("express").Router();
const db = require("../config/db");
router.get("/:serviceId", async (req, res, next) => {
  try {
    const id = req.params.serviceId;
    const [waiting] = await db.query(
      "SELECT * FROM tickets WHERE service_id=? AND status='waiting' ORDER BY priority DESC, created_at ASC", [id]);
    const [called] = await db.query(
      "SELECT * FROM tickets WHERE service_id=? AND status IN ('called','serving') ORDER BY called_at ASC", [id]);
    res.json({ success: true, data: { waiting, called, total: waiting.length } });
  } catch (e) { next(e); }
});
module.exports = router;
