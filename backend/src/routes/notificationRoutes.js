const express = require("express");
const { param } = require("express-validator");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

router.get("/my", protect, notificationController.getMyNotifications);

router.patch(
  "/:id/acknowledge",
  [protect, param("id").isMongoId(), validateRequest],
  notificationController.acknowledgeNotification
);

module.exports = router;
