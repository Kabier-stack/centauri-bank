const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const requireAuth = require("../../middleware/auth");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", requireAuth, controller.logout);
router.get("/me", requireAuth, controller.me);
// Temporary test route — proves the middleware works
router.get("/whoami", requireAuth, (req, res) => {
  res.json({ message: "You are authenticated", userId: req.user.userId });
});
module.exports = router;