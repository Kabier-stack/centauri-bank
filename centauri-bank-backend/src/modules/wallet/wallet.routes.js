const express = require("express");
const router = express.Router();
const controller = require("./wallet.controller");
const requireAuth = require("../../middleware/auth");

router.post("/deposit", requireAuth, controller.deposit);
router.get("/verify-recipient", requireAuth, controller.verifyRecipient);
router.post("/transfer", requireAuth, controller.transfer);
router.post("/admin/adjust-balance", requireAuth, controller.adjustBalance);
router.get("/transactions", requireAuth, controller.getTransactions);
module.exports = router;