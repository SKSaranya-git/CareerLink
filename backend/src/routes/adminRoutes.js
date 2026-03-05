const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const adminController = require("../controllers/adminController");
const notificationController = require("../controllers/notificationController");
const { ROLES } = require("../utils/constants");
const validateRequest = require("../middlewares/validateRequest");

const router = express.Router();

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get admin dashboard overview
 *     security: [{ bearerAuth: [] }]
 *     tags: [Admin]
 *     responses:
 *       200: { description: OK }
 */
router.get("/overview", protect, authorize(ROLES.ADMIN), adminController.getOverview);
router.get("/analytics", protect, authorize(ROLES.ADMIN), adminController.getAnalytics);
router.get("/pending-employers", protect, authorize(ROLES.ADMIN), adminController.getPendingEmployers);
router.patch(
  "/employers/:id/status",
  [
    protect,
    authorize(ROLES.ADMIN),
    param("id").isMongoId(),
    body("status").isIn(["approved", "rejected"]),
    body("reason").optional().isString(),
    validateRequest,
  ],
  adminController.reviewEmployerRegistration
);

router.post(
  "/notifications",
  [
    protect,
    authorize(ROLES.ADMIN),
    body("title").isString().trim().isLength({ min: 3, max: 120 }),
    body("message").isString().trim().isLength({ min: 5, max: 1200 }),
    body("targetRoles")
      .isArray({ min: 1 })
      .withMessage("At least one target role is required."),
    body("targetRoles.*").isIn(Object.values(ROLES)),
    validateRequest,
  ],
  notificationController.createNotification
);

router.get(
  "/notifications",
  [protect, authorize(ROLES.ADMIN)],
  notificationController.getAllNotifications
);

router.get(
  "/notifications/:id",
  [protect, authorize(ROLES.ADMIN), param("id").isMongoId(), validateRequest],
  notificationController.getNotificationById
);

router.put(
  "/notifications/:id",
  [
    protect,
    authorize(ROLES.ADMIN),
    param("id").isMongoId(),
    body("title").isString().trim().isLength({ min: 3, max: 120 }),
    body("message").isString().trim().isLength({ min: 5, max: 1200 }),
    body("targetRoles")
      .isArray({ min: 1 })
      .withMessage("At least one target role is required."),
    body("targetRoles.*").isIn(Object.values(ROLES)),
    validateRequest,
  ],
  notificationController.updateNotification
);

router.delete(
  "/notifications/:id",
  [protect, authorize(ROLES.ADMIN), param("id").isMongoId(), validateRequest],
  notificationController.deleteNotification
);

module.exports = router;
