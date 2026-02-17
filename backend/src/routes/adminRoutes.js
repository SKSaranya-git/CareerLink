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

module.exports = router;
