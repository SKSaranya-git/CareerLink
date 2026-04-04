const express = require("express");
const { body, param } = require("express-validator");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const adminController = require("../controllers/adminController");
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

router.get("/notifications", protect, authorize(ROLES.ADMIN), adminController.listNotifications);
router.get(
  "/notifications/:id",
  [protect, authorize(ROLES.ADMIN), param("id").isMongoId(), validateRequest],
  adminController.getNotificationById
);
router.post(
  "/notifications",
  [
    protect,
    authorize(ROLES.ADMIN),
    body("title").isString().trim().notEmpty().isLength({ max: 120 }),
    body("message").isString().trim().notEmpty().isLength({ max: 1500 }),
    body("type").optional().isIn(["info", "success", "warning", "critical"]),
    body("isActive").optional().isBoolean(),
    body("audienceRoles").optional().isArray({ min: 1 }),
    body("audienceRoles.*").optional().isIn(["all", "admin", "employer", "job_seeker"]),
    validateRequest,
  ],
  adminController.createNotification
);
router.patch(
  "/notifications/:id",
  [
    protect,
    authorize(ROLES.ADMIN),
    param("id").isMongoId(),
    body("title").optional().isString().trim().notEmpty().isLength({ max: 120 }),
    body("message").optional().isString().trim().notEmpty().isLength({ max: 1500 }),
    body("type").optional().isIn(["info", "success", "warning", "critical"]),
    body("isActive").optional().isBoolean(),
    body("audienceRoles").optional().isArray({ min: 1 }),
    body("audienceRoles.*").optional().isIn(["all", "admin", "employer", "job_seeker"]),
    validateRequest,
  ],
  adminController.updateNotification
);
router.delete(
  "/notifications/:id",
  [protect, authorize(ROLES.ADMIN), param("id").isMongoId(), validateRequest],
  adminController.deleteNotification
);

module.exports = router;
