const express = require("express");
const { body, param } = require("express-validator");

const applicationController = require("./application.controller");
const { protect } = require("../../middlewares/authMiddleware");
const { authorize } = require("../../middlewares/roleMiddleware");
const validateRequest = require("../../middlewares/validateRequest");
const { ROLES } = require("../../utils/constants");
const { uploadResume } = require("../../config/multer");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Applications
 *     description: Job applications (seeker, employer, admin)
 */

/**
 * @swagger
 * /api/applications/{jobId}:
 *   post:
 *     summary: Submit application for a job (job seeker, multipart)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       409: { description: Already applied }
 */
// Job Seeker
router.post(
  "/:jobId",
  [
    protect,
    authorize(ROLES.JOB_SEEKER),
    uploadResume.single("resume"),
    param("jobId").isMongoId(),
    body("fullName").notEmpty().withMessage("fullName is required."),
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("phone").notEmpty().withMessage("phone is required."),
    body("coverLetter").optional().isString(),
    body("sendCopyToEmail").optional().isBoolean().toBoolean(),
    validateRequest,
  ],
  applicationController.submitApplication
);

/**
 * @swagger
 * /api/applications/my-applications:
 *   get:
 *     summary: List my applications (job seeker)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get(
  "/my-applications",
  [protect, authorize(ROLES.JOB_SEEKER)],
  applicationController.getMyApplications
);

/**
 * @swagger
 * /api/applications/job/{jobId}:
 *   get:
 *     summary: List applications for a job (employer, job owner)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 */
// Employer
router.get(
  "/job/:jobId",
  [protect, authorize(ROLES.EMPLOYER), param("jobId").isMongoId(), validateRequest],
  applicationController.getApplicationsForJob
);

/**
 * @swagger
 * /api/applications/shortlisted:
 *   get:
 *     summary: Shortlisted applications across my jobs (employer)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get(
  "/shortlisted",
  [protect, authorize(ROLES.EMPLOYER)],
  applicationController.employerGetShortlisted
);

/**
 * @swagger
 * /api/applications/{applicationId}:
 *   get:
 *     summary: Get application by id (employer, applicant, or admin)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: OK }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
router.get(
  "/:applicationId",
  [protect, authorize(ROLES.EMPLOYER, ROLES.JOB_SEEKER, ROLES.ADMIN), param("applicationId").isMongoId(), validateRequest],
  applicationController.getById
);

/**
 * @swagger
 * /api/applications/{applicationId}/status:
 *   patch:
 *     summary: Update application status (employer)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [shortlisted, rejected, hired]
 *     responses:
 *       200: { description: OK }
 */
router.patch(
  "/:applicationId/status",
  [
    protect,
    authorize(ROLES.EMPLOYER),
    param("applicationId").isMongoId(),
    body("status")
      .isIn(["shortlisted", "rejected", "hired"])
      .withMessage("status must be shortlisted, rejected, or hired."),
    validateRequest,
  ],
  applicationController.updateStatus
);

/**
 * @swagger
 * /api/applications/{applicationId}:
 *   delete:
 *     summary: Withdraw pending application (job seeker)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Withdrawn }
 *       400: { description: Not pending }
 *       403: { description: Forbidden }
 */
// Job seeker: withdraw (delete) own application while still pending
router.delete(
  "/:applicationId",
  [
    protect,
    authorize(ROLES.JOB_SEEKER),
    param("applicationId").isMongoId(),
    validateRequest,
  ],
  applicationController.withdrawMyApplication
);

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: List all applications (admin)
 *     tags: [Applications]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
// Admin
router.get("/", [protect, authorize(ROLES.ADMIN)], applicationController.adminGetAll);

module.exports = router;

