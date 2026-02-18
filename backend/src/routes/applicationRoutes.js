
const express = require("express");
const { body, param } = require("express-validator");
const applicationController = require("../controllers/applicationController");
const { protect } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/roleMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const { ROLES } = require("../utils/constants");

const router = express.Router();

/**
 * @swagger
 * /api/applications/my-applications:
 *   get:
 *     summary: Get current user's applications
 *     security: [{ bearerAuth: [] }]
 *     tags: [Applications]
 *     responses:
 *       200: { description: OK }
 */
router.get("/my-applications", protect, applicationController.getMyApplications);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   put:
 *     summary: Update application status (Employer only)
 *     security: [{ bearerAuth: [] }]
 *     tags: [Applications]
 *     responses:
 *       200: { description: OK }
 */
router.put(
    "/:id/status",
    [
        protect,
        authorize(ROLES.EMPLOYER),
        param("id").isMongoId(),
        body("status").isIn(["applied", "reviewing", "accepted", "rejected"]),
        validateRequest,
    ],
    applicationController.updateStatus
);

module.exports = router;
