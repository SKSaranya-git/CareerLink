const express = require("express");
const { param } = require("express-validator");
const { protect } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/me", protect, notificationController.listForCurrentUser);
router.post(
  "/:id/acknowledge",
  [protect, param("id").isMongoId(), validateRequest],
  notificationController.acknowledge
);

module.exports = router;
